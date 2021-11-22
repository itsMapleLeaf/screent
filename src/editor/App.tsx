import React, { useEffect, useRef } from "react"
import { parseTruthy } from "../common/assert"
import { solidButtonClass } from "./components"
import { useAnimationLoop } from "./useAnimationLoop"
import { useElementRect } from "./useElementRect"

type Region = {
  x: number
  y: number
  width: number
  height: number
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const regionRef = useRef<Region>()
  const rect = useElementRect(canvasRef)

  useEffect(() => {
    const canvas = parseTruthy(canvasRef.current)
    canvas.width = rect.width
    canvas.height = rect.height
  }, [rect])

  useAnimationLoop(() => {
    const region = regionRef.current
    if (!region) return

    const canvas = parseTruthy(canvasRef.current)
    const ctx = parseTruthy(canvas.getContext("2d"))

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = ctx.strokeStyle = "#059669"
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.4
    ctx.fillRect(region.x, region.y, region.width, region.height)

    ctx.globalAlpha = 1
    ctx.strokeRect(region.x, region.y, region.width, region.height)
  })

  const handlePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): void => {
    event.preventDefault()

    const region = (regionRef.current = {
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
      width: 0,
      height: 0,
    })

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault()
      region.width = moveEvent.offsetX - region.x
      region.height = moveEvent.offsetY - region.y
    }

    const handlePointerUp = (event: PointerEvent) => {
      event.preventDefault()
      window.removeEventListener("pointermove", handlePointerMove)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp, { once: true })
  }

  return (
    <div className="h-full p-3 gap-3 flex flex-col">
      <canvas
        className="flex-1 bg-slate-800 rounded-md block"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
      />
      <section className="flex gap-3">
        <button className={solidButtonClass}>display 1</button>
        <button className={solidButtonClass}>display 2</button>
        <button className={solidButtonClass}>all displays</button>
        <hr className="bg-slate-700 border-none w-px h-[unset] my-1" />
        <button className={solidButtonClass}>all displays</button>
      </section>
    </div>
  )
}
