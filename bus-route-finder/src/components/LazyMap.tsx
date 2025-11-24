"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import type { MapProps } from "./map"

/**
 * Lazy-loaded Map component for performance optimization
 * Requirements: Lazy load map component to improve initial page load
 * 
 * The map component is loaded only when needed, reducing the initial bundle size
 * and improving page load performance.
 */

// Lazy load the Map component with no SSR
const Map = dynamic<MapProps>(() => import("./map").then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-lg bg-muted animate-pulse flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="inline-block size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

export function LazyMap(props: MapProps) {
  return <Map {...props} />
}
