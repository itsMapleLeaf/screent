import { useEffect, useRef } from "react"

/**
 * Use this to use a value in a useEffect
 * without reacting to its changes
 */
export function useLatestRef<T>(value: T): { readonly current: T } {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
