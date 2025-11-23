import { BusResult, Stop } from './BusResult'

/**
 * Abstract base decorator class
 * Implements the BusResult interface and delegates to the wrapped instance
 */
export abstract class BusResultDecorator implements BusResult {
  constructor(protected busResult: BusResult) {}

  get id(): string {
    return this.busResult.id
  }

  get name(): string {
    return this.busResult.name
  }

  get isAC(): boolean {
    return this.busResult.isAC
  }

  get coachType(): 'standard' | 'express' | 'luxury' {
    return this.busResult.coachType
  }

  get onboardingStop(): Stop {
    return this.busResult.onboardingStop
  }

  get offboardingStop(): Stop {
    return this.busResult.offboardingStop
  }
}
