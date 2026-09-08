import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { markPending, type WithPending } from '@/data/pending'
import { eachVehicleList, readVehicleList, vehicleKeys } from '@/features/vehicles/hooks'
import type { Vehicle } from '@/features/vehicles/types'

import * as recordApi from './api'
import {
  hasActiveFilter,
  type CreateServiceRecordBody,
  type PatchServiceRecordBody,
  type ServiceRecord,
  type TimelineFilter,
} from './types'

export const recordKeys = {
  all: ['service-records'] as const,
  /** The full-timeline key. Filtered views hang off it as `[...list(vehicleId), filter]`. */
  list: (vehicleId: string) => [...recordKeys.all, 'list', vehicleId] as const,
  filtered: (vehicleId: string, filter: TimelineFilter) =>
    [...recordKeys.list(vehicleId), filter] as const,
  detail: (id: string) => [...recordKeys.all, 'detail', id] as const,
}

type Row = WithPending<ServiceRecord>

/**
 * Timeline for one vehicle, newest first. With a filter active the query hangs off
 * a filter-specific key (so pages cache per filter); the optimistic mutations still
 * write the unfiltered timeline and invalidate the prefix, so filtered views refetch.
 */
export function useServiceRecords(vehicleId: string, filter: TimelineFilter = {}) {
  const active = hasActiveFilter(filter)
  return useQuery({
    queryKey: active ? recordKeys.filtered(vehicleId, filter) : recordKeys.list(vehicleId),
    queryFn: () => recordApi.listServiceRecords(vehicleId, filter),
  })
}

function sortNewestFirst(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => (a.performedOn < b.performedOn ? 1 : a.performedOn > b.performedOn ? -1 : 0))
}

function upsert(qc: QueryClient, vehicleId: string, row: Row): void {
  qc.setQueryData<Row[]>(recordKeys.list(vehicleId), (prev = []) =>
    sortNewestFirst([row, ...prev.filter((r) => r.id !== row.id)]),
  )
}

/** Mirror the server mileage rollup in the vehicle caches (data-model.md §4). */
function rollUpVehicleMileage(qc: QueryClient, vehicleId: string, reading: number | null | undefined): void {
  if (reading == null) return
  qc.setQueryData<Vehicle>(vehicleKeys.detail(vehicleId), (v) =>
    v && (v.currentMileage == null || reading > v.currentMileage) ? { ...v, currentMileage: reading } : v,
  )
  eachVehicleList(qc, (list) =>
    list?.map((v) =>
      v.id === vehicleId && (v.currentMileage == null || reading > v.currentMileage)
        ? { ...v, currentMileage: reading }
        : v,
    ),
  )
}

/**
 * POST — optimistic (ADR 0004). The caller mints the id; the entry stamps onto the
 * timeline immediately marked pending, and is reconciled by id on success. A
 * re-POST of the same id is idempotent server-side, so a retried offline log is safe.
 */
export function useLogServiceRecord(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateServiceRecordBody) => recordApi.createServiceRecord(vehicleId, body),
    onMutate: (body) => {
      const now = new Date().toISOString()
      const optimistic: Row = markPending({
        id: body.id,
        vehicleId,
        serviceTypeKey: body.serviceTypeKey,
        performedOn: body.performedOn,
        mileage: body.mileage ?? null,
        costMinor: body.costMinor ?? null,
        costCurrency: body.costCurrency ?? null,
        shopName: body.shopName ?? null,
        notes: body.notes ?? null,
        attachments: [],
        createdAt: now,
        updatedAt: now,
      })
      const prevList = qc.getQueryData<Row[]>(recordKeys.list(vehicleId))
      const prevVehicle = qc.getQueryData<Vehicle>(vehicleKeys.detail(vehicleId))
      const prevVehicleList = readVehicleList(qc)
      upsert(qc, vehicleId, optimistic)
      rollUpVehicleMileage(qc, vehicleId, body.mileage)
      return { prevList, prevVehicle, prevVehicleList }
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prevList) qc.setQueryData(recordKeys.list(vehicleId), ctx.prevList)
      if (ctx?.prevVehicle) qc.setQueryData(vehicleKeys.detail(vehicleId), ctx.prevVehicle)
      if (ctx?.prevVehicleList) eachVehicleList(qc, () => ctx.prevVehicleList)
    },
    onSuccess: (record) => {
      upsert(qc, vehicleId, record)
      qc.setQueryData(recordKeys.detail(record.id), record)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: recordKeys.list(vehicleId) })
      void qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) })
    },
  })
}

/** PATCH — optimistic on the timeline row and the detail. */
export function useUpdateServiceRecord(vehicleId: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PatchServiceRecordBody) => recordApi.patchServiceRecord(id, body),
    onMutate: (body) => {
      const prevList = qc.getQueryData<Row[]>(recordKeys.list(vehicleId))
      qc.setQueryData<Row[]>(recordKeys.list(vehicleId), (prev = []) =>
        sortNewestFirst(prev.map((r) => (r.id === id ? markPending({ ...r, ...body }) : r))),
      )
      if ('mileage' in body) rollUpVehicleMileage(qc, vehicleId, body.mileage)
      return { prevList }
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prevList) qc.setQueryData(recordKeys.list(vehicleId), ctx.prevList)
    },
    onSuccess: (record) => {
      upsert(qc, vehicleId, record)
      qc.setQueryData(recordKeys.detail(id), record)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: recordKeys.list(vehicleId) }),
  })
}

/** DELETE — optimistic remove from the timeline. */
export function useDeleteServiceRecord(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recordApi.deleteServiceRecord(id),
    onMutate: (id) => {
      const prev = qc.getQueryData<Row[]>(recordKeys.list(vehicleId)) ?? []
      qc.setQueryData<Row[]>(
        recordKeys.list(vehicleId),
        prev.filter((r) => r.id !== id),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(recordKeys.list(vehicleId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: recordKeys.list(vehicleId) }),
  })
}
