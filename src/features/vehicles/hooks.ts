import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { clearPending, markPending, type WithPending } from '@/data/pending'

import * as vehicleApi from './api'
import type { CreateVehicleBody, PatchVehicleBody, Vehicle, VehicleListItem } from './types'

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: () => [...vehicleKeys.all, 'list'] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
}

type ListItem = WithPending<VehicleListItem>

/** GET /v1/vehicles — the garage. */
export function useVehicles() {
  return useQuery({
    queryKey: vehicleKeys.list(),
    queryFn: vehicleApi.listVehicles,
  })
}

/** GET /v1/vehicles/{id} — seeded from the list cache so the profile paints instantly. */
export function useVehicle(id: string) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehicleApi.getVehicle(id),
    placeholderData: () => {
      const fromList = qc.getQueryData<ListItem[]>(vehicleKeys.list())?.find((v) => v.id === id)
      if (!fromList) return undefined
      const seed: Vehicle = { ...clearPending(fromList), vinDecode: fromList.vinDecode ?? null }
      return seed
    },
  })
}

function upsertListItem(qc: QueryClient, item: ListItem): void {
  qc.setQueryData<ListItem[]>(vehicleKeys.list(), (prev = []) => {
    const without = prev.filter((v) => v.id !== item.id)
    return [item, ...without]
  })
}

function removeListItem(qc: QueryClient, id: string): ListItem[] {
  const prev = qc.getQueryData<ListItem[]>(vehicleKeys.list()) ?? []
  qc.setQueryData<ListItem[]>(
    vehicleKeys.list(),
    prev.filter((v) => v.id !== id),
  )
  return prev
}

/**
 * POST /v1/vehicles — optimistic (ADR 0004). The caller mints the id (src/data/ids.ts)
 * and passes the whole body; the row shows in the garage immediately, marked pending,
 * and is reconciled by id on success. A re-POST of the same id is idempotent
 * server-side, so a retried offline create is safe.
 */
export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateVehicleBody) => vehicleApi.createVehicle(body),
    onMutate: (body) => {
      const now = new Date().toISOString()
      const optimistic: ListItem = markPending({
        id: body.id,
        vin: body.vin ?? null,
        year: body.year ?? null,
        make: body.make ?? null,
        model: body.model ?? null,
        trim: body.trim ?? null,
        nickname: body.nickname ?? null,
        currentMileage: body.currentMileage ?? null,
        mileageUnit: body.mileageUnit ?? 'mi',
        photoUrl: body.photoUrl ?? null,
        ownedSince: body.ownedSince ?? null,
        vinDecode: null,
        createdAt: now,
        updatedAt: now,
      })
      const prev = qc.getQueryData<ListItem[]>(vehicleKeys.list())
      upsertListItem(qc, optimistic)
      return { prev }
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(vehicleKeys.list(), ctx.prev)
    },
    onSuccess: (vehicle) => {
      upsertListItem(qc, vehicle)
      qc.setQueryData(vehicleKeys.detail(vehicle.id), vehicle)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: vehicleKeys.list() }),
  })
}

/** PATCH /v1/vehicles/{id} — optimistic on both the list row and the detail. */
export function useUpdateVehicle(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PatchVehicleBody) => vehicleApi.patchVehicle(id, body),
    onMutate: (body) => {
      const prevList = qc.getQueryData<ListItem[]>(vehicleKeys.list())
      const prevDetail = qc.getQueryData<Vehicle>(vehicleKeys.detail(id))
      if (prevDetail) {
        qc.setQueryData<WithPending<Vehicle>>(vehicleKeys.detail(id), markPending({ ...prevDetail, ...body }))
      }
      qc.setQueryData<ListItem[]>(vehicleKeys.list(), (prev = []) =>
        prev.map((v) => (v.id === id ? markPending({ ...v, ...body }) : v)),
      )
      return { prevList, prevDetail }
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prevList) qc.setQueryData(vehicleKeys.list(), ctx.prevList)
      if (ctx?.prevDetail) qc.setQueryData(vehicleKeys.detail(id), ctx.prevDetail)
    },
    onSuccess: (vehicle) => {
      qc.setQueryData(vehicleKeys.detail(id), vehicle)
      upsertListItem(qc, vehicle)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: vehicleKeys.detail(id) })
      void qc.invalidateQueries({ queryKey: vehicleKeys.list() })
    },
  })
}

/** DELETE /v1/vehicles/{id} — optimistic remove from the garage. */
export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vehicleApi.deleteVehicle(id),
    onMutate: (id) => ({ prev: removeListItem(qc, id) }),
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(vehicleKeys.list(), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: vehicleKeys.list() }),
  })
}

/**
 * POST /v1/vehicles/{id}/decode-vin — always 200; `decoded:false` when NHTSA is
 * unavailable (the vehicle is still usable). Writes the returned vehicle into both caches.
 */
export function useDecodeVin(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => vehicleApi.decodeVin(id),
    onSuccess: (result) => {
      qc.setQueryData(vehicleKeys.detail(id), result.vehicle)
      upsertListItem(qc, result.vehicle)
    },
  })
}
