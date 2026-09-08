import { useQuery } from '@tanstack/react-query'

import * as recordApi from './api'

/** The open-enum list, for the log-service picker. Rarely changes — cache it long. */
export function useServiceTypes() {
  return useQuery({
    queryKey: ['service-types'],
    queryFn: recordApi.listServiceTypes,
    staleTime: 1000 * 60 * 60,
  })
}
