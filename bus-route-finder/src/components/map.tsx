"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

interface MapProps {
  stops?: Array<{ id: string; name: string; latitude: number; longitude: number }>
  center?: { lat: number; lng: number }
  zoom?: number
}

export function Map({ stops = [], center = { lat: 23.8103, lng: 90.4125 }, zoom = 12 }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    // only run in browser
    if (typeof window === "undefined") return

    const initMap = async () => {
      const L = await import("leaflet")

      if (!mapContainer.current || isInitialized.current) return

      map.current = L.map(mapContainer.current).setView([center.lat, center.lng], zoom)
      isInitialized.current = true

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map.current)

      // Add initial markers
      stops.forEach((stop) => {
        L.marker([stop.latitude, stop.longitude]).bindPopup(`<strong>${stop.name}</strong>`).addTo(map.current)
      })
    }

    initMap().catch((err) => console.error("[v0] Map init error:", err))

    return () => {
      if (map.current && isInitialized.current) {
        map.current.remove()
        map.current = null
        isInitialized.current = false
      }
    }
  }, [])

  useEffect(() => {
    if (!map.current || !isInitialized.current) return

    const updateMarkers = async () => {
      const L = await import("leaflet")

      // Clear existing markers
      map.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.current.removeLayer(layer)
        }
      })

      // Add new markers
      stops.forEach((stop) => {
        L.marker([stop.latitude, stop.longitude]).bindPopup(`<strong>${stop.name}</strong>`).addTo(map.current)
      })
    }

    updateMarkers().catch((err) => console.error("[v0] Marker update error:", err))
  }, [stops])

  return <div ref={mapContainer} className="w-full h-96 rounded-lg border" />
}
