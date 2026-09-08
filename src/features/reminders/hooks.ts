import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { markPending, type WithPending } from '@/data/pending'
import { readVehicleList, vehicleKeys } from '@/features/vehicles/hooks'
import type { Vehicle } from '@/features/vehicles/types'

import * as reminderApi from './api'
import { computeReminderStatus, todayIso } from './status'
import type { CreateReminderBody, PatchReminderBody, Reminder } from './types'

export const reminderKeys = {
  all: ['reminders'] as const,
  list: (vehicleId: string) => [...reminderKeys.all, 'list', vehicleId] as const,
  detail: (id: string) => [...reminderKeys.all, 'detail', id] as const,
}

type Row = WithPending<Reminder>

/** All reminders for one vehicle, with computed status. */
export function useReminders(vehicleId: string) {
  return useQuery({
    queryKey: reminderKeys.list(vehicleId),
    queryFn: () => reminderApi.listReminders(vehicleId),
  })
}

function currentMileageOf(qc: QueryClient, vehicleId: string): number | null {
  const detail = qc.getQueryData<Vehicle>(vehicleKeys.detail(vehicleId))
  if (detail?.currentMileage != null) return detail.currentMileage
  const fromList = readVehicleList(qc)?.find((v) => v.id === vehicleId)
  return fromList?.currentMileage ?? null
}

/** Recompute status/remaining locally so an optimistic row looks right immediately. */
function withComputedStatus(reminder: Reminder, currentMileage: number | null): Reminder {
  const computed = computeReminderStatus({
    intervalMiles: reminder.intervalMiles,
    intervalMonths: reminder.intervalMonths,
    lastCompletedOn: reminder.lastCompletedOn,
    lastCompletedMileage: reminder.lastCompletedMileage,
    currentMileage,
    today: todayIso(),
  })
  return { ...reminder, ...computed }
}

function upsert(qc: QueryClient, vehicleId: string, row: Row): void {
  qc.setQueryData<Row[]>(reminderKeys.list(vehicleId), (prev = []) => [
    ...prev.filter((r) => r.id !== row.id),
    row,
  ])
}

/** POST — optimistic (ADR 0004). The caller mints the id; a re-POST is idempotent. */
export function useCreateReminder(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateReminderBody) => reminderApi.createReminder(vehicleId, body),
    onMutate: (body) => {
      const now = new Date().toISOString()
      const mileage = currentMileageOf(qc, vehicleId)
      const base: Reminder = {
        id: body.id,
        vehicleId,
        serviceTypeKey: body.serviceTypeKey ?? null,
        title: body.title,
        intervalMiles: body.intervalMiles ?? null,
        intervalMonths: body.intervalMonths ?? null,
        // The server anchors a new reminder to "now" when the caller sends none.
        lastCompletedOn: body.lastCompletedOn ?? todayIso(),
        lastCompletedMileage: body.lastCompletedMileage ?? mileage,
        status: 'ok',
        milesRemaining: null,
        daysRemaining: null,
        dueMileage: null,
        dueDate: null,
        createdAt: now,
        updatedAt: now,
      }
      const optimistic = markPending(withComputedStatus(base, mileage))
      const prev = qc.getQueryData<Row[]>(reminderKeys.list(vehicleId))
      upsert(qc, vehicleId, optimistic)
      return { prev }
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(reminderKeys.list(vehicleId), ctx.prev)
    },
    onSuccess: (reminder) => {
      upsert(qc, vehicleId, reminder)
      qc.setQueryData(reminderKeys.detail(reminder.id), reminder)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: reminderKeys.list(vehicleId) }),
  })
}

/** PATCH — edit fields, optimistic on the list row. */
export function useUpdateReminder(vehicleId: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PatchReminderBody) => reminderApi.patchReminder(id, body),
    onMutate: (body) => {
      const mileage = currentMileageOf(qc, vehicleId)
      const prev = qc.getQueryData<Row[]>(reminderKeys.list(vehicleId))
      qc.setQueryData<Row[]>(reminderKeys.list(vehicleId), (rows = []) =>
        rows.map((r) =>
          r.id === id ? markPending(withComputedStatus({ ...r, ...body }, mileage)) : r,
        ),
      )
      return { prev }
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(reminderKeys.list(vehicleId), ctx.prev)
    },
    onSuccess: (reminder) => {
      upsert(qc, vehicleId, reminder)
      qc.setQueryData(reminderKeys.detail(id), reminder)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: reminderKeys.list(vehicleId) }),
  })
}

/**
 * PATCH { markCompleted: true } — the "mark done" action. Optimistically re-anchors
 * to today + the vehicle's current mileage so the amber badge drains and "next due"
 * recomputes on the spot.
 */
export function useCompleteReminder(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reminderApi.patchReminder(id, { markCompleted: true }),
    onMutate: (id) => {
      const mileage = currentMileageOf(qc, vehicleId)
      const prev = qc.getQueryData<Row[]>(reminderKeys.list(vehicleId))
      qc.setQueryData<Row[]>(reminderKeys.list(vehicleId), (rows = []) =>
        rows.map((r) =>
          r.id === id
            ? markPending(
                withComputedStatus(
                  { ...r, lastCompletedOn: todayIso(), lastCompletedMileage: mileage },
                  mileage,
                ),
              )
            : r,
        ),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(reminderKeys.list(vehicleId), ctx.prev)
    },
    onSuccess: (reminder) => {
      upsert(qc, vehicleId, reminder)
      qc.setQueryData(reminderKeys.detail(reminder.id), reminder)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: reminderKeys.list(vehicleId) }),
  })
}

/** DELETE — optimistic remove. */
export function useDeleteReminder(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reminderApi.deleteReminder(id),
    onMutate: (id) => {
      const prev = qc.getQueryData<Row[]>(reminderKeys.list(vehicleId)) ?? []
      qc.setQueryData<Row[]>(
        reminderKeys.list(vehicleId),
        prev.filter((r) => r.id !== id),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(reminderKeys.list(vehicleId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: reminderKeys.list(vehicleId) }),
  })
}

/** The worst status across a vehicle's reminders — drives the amber badge on the card. */
export function worstStatus(reminders: Pick<Reminder, 'status'>[] | undefined): Reminder['status'] {
  if (!reminders || reminders.length === 0) return 'ok'
  if (reminders.some((r) => r.status === 'overdue')) return 'overdue'
  if (reminders.some((r) => r.status === 'due')) return 'due'
  return 'ok'
}
