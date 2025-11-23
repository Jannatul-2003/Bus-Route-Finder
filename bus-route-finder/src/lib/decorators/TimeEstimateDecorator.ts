import { BusResult } from './BusResult'
import { BusResultDecorator } from './BusResultDecorator'

/**
 * Decorator that adds time estimates for journey and walking
 * Uses average speeds to calculate estimated times
 */
export class TimeEstimateDecorator extends BusResultDecorator {
  private readonly AVERAGE_BUS_SPEED_KMH = 20
  private readonly AVERAGE_WALKING_SPEED_KMH = 5

  private readonly _journeyLength: number
  private readonly _totalWalkingDistance: number

  constructor(
    busResult: BusResult,
    journeyLength: number,
    totalWalkingDistance: number
  ) {
    super(busResult)
    this._journeyLength = journeyLength
    this._totalWalkingDistance = totalWalkingDistance
  }

  /**
   * Get estimated journey time on the bus
   * @returns Time in minutes
   */
  getEstimatedJourneyTime(): number {
    return (this._journeyLength / this.AVERAGE_BUS_SPEED_KMH) * 60
  }

  /**
   * Get estimated walking time (both ends combined)
   * @returns Time in minutes
   */
  getEstimatedWalkingTime(): number {
    return (this._totalWalkingDistance / this.AVERAGE_WALKING_SPEED_KMH) * 60
  }

  /**
   * Get total estimated time (journey + walking)
   * @returns Time in minutes
   */
  getEstimatedTotalTime(): number {
    return this.getEstimatedJourneyTime() + this.getEstimatedWalkingTime()
  }
}
