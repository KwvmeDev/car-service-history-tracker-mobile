import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { recordKeys } from '@/features/service-records/hooks'
import { vehicleKeys } from '@/features/vehicles/hooks'

import * as mechanicApi from './api'
import type { MechanicSubmission } from './types'

export const mechanicKeys = {
  all: ['mechanic'] as const,
  links: (vehicleId: string) => [...mechanicKeys.all, 'links', vehicleId] as const,
  submissions: (vehicleId: string) => [...mechanicKeys.all, 'submissions', vehicleId] as const,
}

export function useMechanicLinks(vehicleId: string, enabled = true) {
  return useQuery({
    queryKey: mechanicKeys.links(vehicleId),
    queryFn: () => mechanicApi.listLinks(vehicleId),
    enabled,
  })
}

export function useCreateMechanicLink(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (label?: string) => mechanicApi.createLink(vehicleId, label),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mechanicKeys.links(vehicleId) })
    },
  })
}

export function useRevokeMechanicLink(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mechanicApi.revokeLink(id),
    onSettled: () => qc.invalidateQueries({ queryKey: mechanicKeys.links(vehicleId) }),
  })
}

/** The owner's review queue for a vehicle. Poll it lightly so a fresh scan shows. */
export function useMechanicSubmissions(vehicleId: string, enabled = true) {
  return useQuery({
    queryKey: mechanicKeys.submissions(vehicleId),
    queryFn: () => mechanicApi.listSubmissions(vehicleId, 'pending'),
    enabled,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  })
}

function removeFromQueue(qc: ReturnType<typeof useQueryClient>, vehicleId: string, id: string): MechanicSubmission[] {
  const prev = qc.getQueryData<MechanicSubmission[]>(mechanicKeys.submissions(vehicleId)) ?? []
  qc.setQueryData<MechanicSubmission[]>(
    mechanicKeys.submissions(vehicleId),
    prev.filter((s) => s.id !== id),
  )
  return prev
}

/** Accept → the server mints a service record; drop it from the queue, refresh the timeline. */
export function useAcceptSubmission(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mechanicApi.acceptSubmission(id),
    onMutate: (id) => ({ prev: removeFromQueue(qc, vehicleId, id) }),
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(mechanicKeys.submissions(vehicleId), ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: mechanicKeys.submissions(vehicleId) })
      void qc.invalidateQueries({ queryKey: recordKeys.list(vehicleId) })
      void qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) })
    },
  })
}

export function useRejectSubmission(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mechanicApi.rejectSubmission(id),
    onMutate: (id) => ({ prev: removeFromQueue(qc, vehicleId, id) }),
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(mechanicKeys.submissions(vehicleId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: mechanicKeys.submissions(vehicleId) }),
  })
}
