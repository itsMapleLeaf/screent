import { useEffect } from "react"
import { useLatestRef } from "./useLatestRef"

export function useAnimationLoop(callback: () => void) {
  const callbackRef = useLatestRef(callback)

  useEffect(() => {
    let running = true

    void (async () => {
      while (running) {
        callbackRef.current()
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
    })()

    return () => {
      running = false
    }
  }, [callbackRef])
}
