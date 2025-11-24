export interface Observer<T> {
  update(state: T): void
}

export class Observable<T> {
  #observers: Set<Observer<T>>

  constructor() {
    this.#observers = new Set()
  }

  subscribe(observer: Observer<T>) {
    this.#observers.add(observer)
  }

  unsubscribe(observer: Observer<T>) {
    this.#observers.delete(observer)
  }

  protected notify(state: T) {
    this.#observers.forEach((observer) => {
      try {
        observer.update(state)
      } catch (error) {
        // Log error but continue notifying other observers
        console.error('[Observable] Observer update failed:', error)
      }
    })
  }
}

