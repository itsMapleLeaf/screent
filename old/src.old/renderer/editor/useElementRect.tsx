import type { RefObject } from "react"
import { useEffect, useState } from "react"

export function useElementRect(
  ref: Element | RefObject<Element> | null | undefined,
) {
  const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 })

  useEffect(() => {
    const element = ref instanceof Element ? ref : ref?.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      setRect(entry!.contentRect)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return rect
}
