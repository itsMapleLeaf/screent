import type { Observable } from "micro-observables"
import { observable } from "micro-observables"
import { useLayoutEffect, useState } from "react"

export function useValueAsObservable<T>(value: T): Observable<T> {
  const [obs] = useState(() => observable(value))

  // use layout effect to ensure this is updated as soon as possible
  // the incoming value needs to be stable
  useLayoutEffect(() => obs.set(value), [obs, value])

  return obs
}
