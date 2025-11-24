"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

export interface Coordinates {
  lat: number
  lng: number
}

export interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
}

export interface MapProps {
  // All discovered stops
  stops?: Stop[]
  
  // Location markers
  startingLocation?: Coordinates | null
  destinationLocation?: Coordinates | null
  
  // Selected stops
  selectedOnboardingStop?: Stop | null
  selectedOffboardingStop?: Stop | null
  
  // Default center and zoom
  center?: Coordinates
  zoom?: number
}

export function Map({ 
  stops = [], 
  startingLocation = null,
  destinationLocation = null,
  selectedOnboardingStop = null,
  selectedOffboardingStop = null,
  center = { lat: 23.8103, lng: 90.4125 }, 
  zoom = 12 
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markersLayer = useRef<any>(null)
  const polylinesLayer = useRef<any>(null)
  const isInitialized = useRef(false)

  // Initialize map
  useEffect(() => {
    // only run in browser
    if (typeof window === "undefined") return

    const initMap = async () => {
      const L = await import("leaflet")

      if (!mapContainer.current || isInitialized.current) return

      // Detect if mobile device
      const isMobile = window.innerWidth < 768

      // Create map with mobile-optimized settings
      map.current = L.map(mapContainer.current, {
        // Enable touch interactions for mobile
        touchZoom: true,
        scrollWheelZoom: !isMobile, // Disable scroll zoom on mobile to prevent accidental zooming
        doubleClickZoom: true,
        boxZoom: !isMobile,
        keyboard: true,
        dragging: true,
        zoomControl: false, // We'll add custom zoom control
        // Mobile-specific optimizations
        fadeAnimation: !isMobile,
        zoomAnimation: true,
        markerZoomAnimation: !isMobile,
      }).setView([center.lat, center.lng], zoom)
      
      isInitialized.current = true

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        // Mobile optimizations
        updateWhenIdle: isMobile,
        updateWhenZooming: !isMobile,
        keepBuffer: isMobile ? 1 : 2,
      }).addTo(map.current)

      // Create layer groups for markers and polylines
      markersLayer.current = L.layerGroup().addTo(map.current)
      polylinesLayer.current = L.layerGroup().addTo(map.current)

      // Add zoom control with mobile-friendly positioning
      L.control.zoom({ 
        position: isMobile ? 'bottomright' : 'topright',
        zoomInTitle: 'Zoom in',
        zoomOutTitle: 'Zoom out'
      }).addTo(map.current)

      // Add scale control for mobile
      if (isMobile) {
        L.control.scale({ 
          position: 'bottomleft',
          imperial: false 
        }).addTo(map.current)
      }

      // Enable swipe gestures on mobile
      if (isMobile && map.current) {
        // Add custom event handlers for better touch experience
        map.current.on('movestart', () => {
          if (mapContainer.current) {
            mapContainer.current.style.cursor = 'grabbing'
          }
        })
        
        map.current.on('moveend', () => {
          if (mapContainer.current) {
            mapContainer.current.style.cursor = 'grab'
          }
        })
      }
    }

    initMap().catch((err) => console.error("[Map] Init error:", err))

    return () => {
      if (map.current && isInitialized.current) {
        map.current.remove()
        map.current = null
        isInitialized.current = false
      }
    }
  }, [])

  // Update markers and polylines when props change
  useEffect(() => {
    if (!map.current || !isInitialized.current) return

    const updateMapContent = async () => {
      const L = await import("leaflet")

      // Clear existing markers and polylines
      if (markersLayer.current) {
        markersLayer.current.clearLayers()
      }
      if (polylinesLayer.current) {
        polylinesLayer.current.clearLayers()
      }

      const bounds: [number, number][] = []

      // Custom icon factory
      const createIcon = (color: string, iconHtml: string) => {
        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="transform: rotate(45deg); color: white; font-size: 16px;">
                ${iconHtml}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        })
      }

      // Requirement 10.4: Display starting location marker (blue)
      if (startingLocation) {
        const startIcon = createIcon('#3b82f6', '📍')
        L.marker([startingLocation.lat, startingLocation.lng], { icon: startIcon })
          .bindPopup('<strong>Starting Location</strong>')
          .addTo(markersLayer.current)
        bounds.push([startingLocation.lat, startingLocation.lng])
      }

      // Requirement 10.4: Display destination location marker (purple)
      if (destinationLocation) {
        const destIcon = createIcon('#a855f7', '🎯')
        L.marker([destinationLocation.lat, destinationLocation.lng], { icon: destIcon })
          .bindPopup('<strong>Destination Location</strong>')
          .addTo(markersLayer.current)
        bounds.push([destinationLocation.lat, destinationLocation.lng])
      }

      // Requirement 10.1: Display all discovered stops as markers on map
      stops.forEach((stop) => {
        const isOnboarding = selectedOnboardingStop?.id === stop.id
        const isOffboarding = selectedOffboardingStop?.id === stop.id

        let icon
        let popupContent = `<strong>${stop.name}</strong>`

        // Requirement 10.2: Highlight selected onboarding stop with distinct marker (green)
        if (isOnboarding) {
          icon = createIcon('#22c55e', '🚌')
          popupContent = `<strong>${stop.name}</strong><br/><em>Onboarding Stop</em>`
        } 
        // Requirement 10.3: Highlight selected offboarding stop with distinct marker (red)
        else if (isOffboarding) {
          icon = createIcon('#ef4444', '🚌')
          popupContent = `<strong>${stop.name}</strong><br/><em>Offboarding Stop</em>`
        } 
        // Regular stop marker (gray)
        else {
          icon = createIcon('#6b7280', '•')
        }

        L.marker([stop.latitude, stop.longitude], { icon })
          .bindPopup(popupContent)
          .addTo(markersLayer.current)
        
        bounds.push([stop.latitude, stop.longitude])
      })

      // Requirement 10.5: Draw polyline from starting location to onboarding stop
      if (startingLocation && selectedOnboardingStop) {
        L.polyline(
          [
            [startingLocation.lat, startingLocation.lng],
            [selectedOnboardingStop.latitude, selectedOnboardingStop.longitude]
          ],
          {
            color: '#22c55e',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
          }
        ).addTo(polylinesLayer.current)
      }

      // Requirement 10.5: Draw polyline from offboarding stop to destination location
      if (destinationLocation && selectedOffboardingStop) {
        L.polyline(
          [
            [selectedOffboardingStop.latitude, selectedOffboardingStop.longitude],
            [destinationLocation.lat, destinationLocation.lng]
          ],
          {
            color: '#ef4444',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
          }
        ).addTo(polylinesLayer.current)
      }

      // Requirement 10.5: Auto-zoom to fit all markers
      if (bounds.length > 0) {
        map.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15
        })
      }
    }

    updateMapContent().catch((err) => console.error("[Map] Update error:", err))
  }, [
    stops, 
    startingLocation, 
    destinationLocation, 
    selectedOnboardingStop, 
    selectedOffboardingStop
  ])

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[300px] sm:h-[400px] lg:h-96 rounded-lg border touch-pan-x touch-pan-y"
      style={{ 
        cursor: 'grab',
        touchAction: 'pan-x pan-y' 
      }}
    />
  )
}
