import { BusResult } from './BusResult'
import { BusResultDecorator } from './BusResultDecorator'

/**
 * Decorator that adds journey length calculation
 * Journey length is the total distance traveled on the bus from onboarding to offboarding stop
 */
export class JourneyLengthDecorator extends BusResultDecorator {
  private readonly _journeyLength: number

  constructor(busResult: BusResult, journeyLength: number) {
    super(busResult)
    this._journeyLength = journeyLength
  }

  /**
   * Get the journey length in kilometers
   * @returns Journey length in kilometers
   */
  getJourneyLength(): number {
    return this._journeyLength
  }
}
