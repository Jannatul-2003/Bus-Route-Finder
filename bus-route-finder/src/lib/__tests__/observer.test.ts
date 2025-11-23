import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Observable, type Observer } from '../observer'

describe('Observable - Observer Pattern Base Class', () => {
  interface TestState {
    value: number
    message: string
  }

  class TestObservable extends Observable<TestState> {
    private state: TestState = { value: 0, message: '' }

    setState(newState: Partial<TestState>) {
      this.state = { ...this.state, ...newState }
      this.notify(this.state)
    }

    getState() {
      return this.state
    }
  }

  let observable: TestObservable
  let observer1: Observer<TestState>
  let observer2: Observer<TestState>

  beforeEach(() => {
    observable = new TestObservable()
    observer1 = {
      update: vi.fn(),
    }
    observer2 = {
      update: vi.fn(),
    }
  })

  describe('Subscription Management', () => {
    it('should allow observers to subscribe', () => {
      observable.subscribe(observer1)
      observable.setState({ value: 1, message: 'test' })

      expect(observer1.update).toHaveBeenCalledTimes(1)
      expect(observer1.update).toHaveBeenCalledWith({ value: 1, message: 'test' })
    })

    it('should allow multiple observers to subscribe', () => {
      observable.subscribe(observer1)
      observable.subscribe(observer2)
      observable.setState({ value: 2, message: 'multiple' })

      expect(observer1.update).toHaveBeenCalledTimes(1)
      expect(observer2.update).toHaveBeenCalledTimes(1)
      expect(observer1.update).toHaveBeenCalledWith({ value: 2, message: 'multiple' })
      expect(observer2.update).toHaveBeenCalledWith({ value: 2, message: 'multiple' })
    })

    it('should allow observers to unsubscribe', () => {
      observable.subscribe(observer1)
      observable.subscribe(observer2)

      observable.setState({ value: 1, message: 'before unsubscribe' })
      expect(observer1.update).toHaveBeenCalledTimes(1)
      expect(observer2.update).toHaveBeenCalledTimes(1)

      observable.unsubscribe(observer1)
      observable.setState({ value: 2, message: 'after unsubscribe' })

      expect(observer1.update).toHaveBeenCalledTimes(1) // Should not be called again
      expect(observer2.update).toHaveBeenCalledTimes(2) // Should still receive updates
    })

    it('should handle unsubscribing non-existent observer gracefully', () => {
      const nonExistentObserver: Observer<TestState> = { update: vi.fn() }
      expect(() => observable.unsubscribe(nonExistentObserver)).not.toThrow()
    })

    it('should not notify unsubscribed observers', () => {
      observable.subscribe(observer1)
      observable.setState({ value: 1, message: 'first' })

      observable.unsubscribe(observer1)
      observable.setState({ value: 2, message: 'second' })

      expect(observer1.update).toHaveBeenCalledTimes(1)
      expect(observer1.update).toHaveBeenCalledWith({ value: 1, message: 'first' })
    })
  })

  describe('Notification Mechanism', () => {
    it('should notify all subscribed observers when state changes', () => {
      observable.subscribe(observer1)
      observable.subscribe(observer2)

      observable.setState({ value: 10, message: 'notify all' })

      expect(observer1.update).toHaveBeenCalledWith({ value: 10, message: 'notify all' })
      expect(observer2.update).toHaveBeenCalledWith({ value: 10, message: 'notify all' })
    })

    it('should notify observers with the latest state', () => {
      observable.subscribe(observer1)

      observable.setState({ value: 1, message: 'first' })
      observable.setState({ value: 2, message: 'second' })
      observable.setState({ value: 3, message: 'third' })

      expect(observer1.update).toHaveBeenCalledTimes(3)
      expect(observer1.update).toHaveBeenLastCalledWith({ value: 3, message: 'third' })
    })

    it('should notify observers even if one throws an error', () => {
      const errorObserver: Observer<TestState> = {
        update: vi.fn(() => {
          throw new Error('Observer error')
        }),
      }

      observable.subscribe(errorObserver)
      observable.subscribe(observer1)

      expect(() => observable.setState({ value: 1, message: 'test' })).not.toThrow()
      expect(observer1.update).toHaveBeenCalledTimes(1) // Should still be notified
    })
  })

  describe('Observer Pattern Principles', () => {
    it('should maintain loose coupling - observers are independent', () => {
      observable.subscribe(observer1)
      observable.subscribe(observer2)

      // Each observer should receive updates independently
      observable.setState({ value: 1, message: 'test' })

      expect(observer1.update).toHaveBeenCalled()
      expect(observer2.update).toHaveBeenCalled()
    })

    it('should support one-to-many dependency - one observable, many observers', () => {
      const observers = Array.from({ length: 5 }, () => ({
        update: vi.fn(),
      }))

      observers.forEach((observer) => observable.subscribe(observer))
      observable.setState({ value: 100, message: 'broadcast' })

      observers.forEach((observer) => {
        expect(observer.update).toHaveBeenCalledTimes(1)
        expect(observer.update).toHaveBeenCalledWith({ value: 100, message: 'broadcast' })
      })
    })

    it('should allow dynamic subscription and unsubscription', () => {
      observable.subscribe(observer1)
      observable.setState({ value: 1, message: 'with observer1' })

      observable.subscribe(observer2)
      observable.setState({ value: 2, message: 'with both' })

      observable.unsubscribe(observer1)
      observable.setState({ value: 3, message: 'only observer2' })

      expect(observer1.update).toHaveBeenCalledTimes(2) // Only first two updates
      expect(observer2.update).toHaveBeenCalledTimes(2) // Last two updates
    })
  })
})

