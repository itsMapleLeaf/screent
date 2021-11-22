import { useEffect } from "react"

export function useWindowEvent<EventName extends keyof WindowEventMap>(
  event: EventName | EventName[],
  handler: (event: WindowEventMap[EventName]) => void,
  options?: boolean | AddEventListenerOptions,
) {
  useEffect(() => {
    const events = [event].flat() as EventName[]

    for (const event of events) {
      window.addEventListener(event, handler, options)
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handler, options)
      }
    }
  })
}
