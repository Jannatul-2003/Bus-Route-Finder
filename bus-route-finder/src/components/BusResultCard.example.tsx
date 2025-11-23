import { BusResultCard } from "./BusResultCard"
import type { EnhancedBusResult } from "@/lib/decorators/BusResult"

/**
 * Example usage of BusResultCard component
 * This file demonstrates various use cases and configurations
 */

// Example 1: AC Express Bus
const acExpressBus: EnhancedBusResult = {
  id: "bus-1",
  name: "Bus #42 - Express",
  isAC: true,
  coachType: "express",
  onboardingStop: {
    id: "stop-1",
    name: "Gulshan Circle 1",
    latitude: 23.7808,
    longitude: 90.4172,
  },
  offboardingStop: {
    id: "stop-2",
    name: "Motijheel",
    latitude: 23.7334,
    longitude: 90.4182,
  },
  journeyLength: 2.5,
  walkingDistanceToOnboarding: 0.25,
  walkingDistanceFromOffboarding: 0.42,
  totalWalkingDistance: 0.67,
  totalDistance: 3.17,
  estimatedJourneyTime: 15,
  estimatedWalkingTime: 8,
  estimatedTotalTime: 23,
}

// Example 2: Non-AC Standard Bus
const standardBus: EnhancedBusResult = {
  id: "bus-2",
  name: "Bus #15",
  isAC: false,
  coachType: "standard",
  onboardingStop: {
    id: "stop-3",
    name: "Dhanmondi 27",
    latitude: 23.7465,
    longitude: 90.3765,
  },
  offboardingStop: {
    id: "stop-4",
    name: "Farmgate",
    latitude: 23.7588,
    longitude: 90.3897,
  },
  journeyLength: 3.2,
  walkingDistanceToOnboarding: 0.18,
  walkingDistanceFromOffboarding: 0.35,
  totalWalkingDistance: 0.53,
  totalDistance: 3.73,
  estimatedJourneyTime: 20,
  estimatedWalkingTime: 6,
  estimatedTotalTime: 26,
}

// Example 3: AC Luxury Bus
const luxuryBus: EnhancedBusResult = {
  id: "bus-3",
  name: "Bus #88 - Luxury",
  isAC: true,
  coachType: "luxury",
  onboardingStop: {
    id: "stop-5",
    name: "Uttara Sector 7",
    latitude: 23.8759,
    longitude: 90.3795,
  },
  offboardingStop: {
    id: "stop-6",
    name: "Shahbagh",
    latitude: 23.7389,
    longitude: 90.3958,
  },
  journeyLength: 12.8,
  walkingDistanceToOnboarding: 0.45,
  walkingDistanceFromOffboarding: 0.28,
  totalWalkingDistance: 0.73,
  totalDistance: 13.53,
  estimatedJourneyTime: 45,
  estimatedWalkingTime: 9,
  estimatedTotalTime: 54,
}

// Example 4: Short distance bus
const shortDistanceBus: EnhancedBusResult = {
  id: "bus-4",
  name: "Bus #7",
  isAC: false,
  coachType: "standard",
  onboardingStop: {
    id: "stop-7",
    name: "Mirpur 10",
    latitude: 23.8069,
    longitude: 90.3687,
  },
  offboardingStop: {
    id: "stop-8",
    name: "Mirpur 11",
    latitude: 23.8103,
    longitude: 90.3698,
  },
  journeyLength: 0.8,
  walkingDistanceToOnboarding: 0.15,
  walkingDistanceFromOffboarding: 0.12,
  totalWalkingDistance: 0.27,
  totalDistance: 1.07,
  estimatedJourneyTime: 5,
  estimatedWalkingTime: 3,
  estimatedTotalTime: 8,
}

export function BusResultCardExamples() {
  const handleSelect = (bus: EnhancedBusResult) => {
    console.log("Selected bus:", bus.name)
    alert(`You selected ${bus.name}`)
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">BusResultCard Examples</h2>
        <p className="text-muted-foreground mb-6">
          Various configurations of the BusResultCard component
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Example 1: AC Express Bus
          </h3>
          <BusResultCard bus={acExpressBus} onSelect={handleSelect} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            Example 2: Non-AC Standard Bus
          </h3>
          <BusResultCard bus={standardBus} onSelect={handleSelect} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            Example 3: AC Luxury Bus (Long Distance)
          </h3>
          <BusResultCard bus={luxuryBus} onSelect={handleSelect} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            Example 4: Short Distance Bus
          </h3>
          <BusResultCard bus={shortDistanceBus} onSelect={handleSelect} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            Example 5: Without Select Button
          </h3>
          <BusResultCard bus={acExpressBus} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            Example 6: With Custom Styling
          </h3>
          <BusResultCard
            bus={luxuryBus}
            onSelect={handleSelect}
            className="border-2 border-primary"
          />
        </div>
      </div>
    </div>
  )
}

export default BusResultCardExamples
