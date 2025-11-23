"use client"

import { useEffect, useMemo, useState } from "react"
import {
  routePlannerStore,
  type RoutePlannerState,
  type SearchResult,
} from "@/lib/stores/routePlannerStore"

export function useRoutePlanner() {
  const [state, setState] = useState<RoutePlannerState>(routePlannerStore.getState())

  useEffect(() => {
    const observer = {
      update: (updatedState: RoutePlannerState) => {
        setState(updatedState)
      },
    }

    routePlannerStore.subscribe(observer)
    routePlannerStore.ensureInitialized().catch((error) => {
      console.error("[v0] Failed to initialize route planner store:", error)
    })

    return () => {
      routePlannerStore.unsubscribe(observer)
    }
  }, [])

  const actions = useMemo(
    () => ({
      setFromLocation: (value: string) => routePlannerStore.setFromLocation(value),
      setToLocation: (value: string) => routePlannerStore.setToLocation(value),
      handleGetLocation: () => routePlannerStore.handleGetLocation(),
      searchRoutes: () => routePlannerStore.searchRoutes(),
      selectResult: (result: SearchResult) => routePlannerStore.selectResult(result),
    }),
    [],
  )

  return { state, actions }
}

