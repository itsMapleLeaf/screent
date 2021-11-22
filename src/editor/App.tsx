import React, { useEffect, useRef } from "react"
import { parseTruthy } from "../common/assert"
import { rect } from "../common/Rect"
import { vec } from "../common/Vec"
import { solidButtonClass } from "./components"
import { RegionSelector } from "./RegionSelector"
import { useAnimationLoop } from "./useAnimationLoop"
import { useElementRect } from "./useElementRect"

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const regionSelectorRef = useRef<RegionSelector>()
  const canvasRect = useElementRect(canvasRef)

  useEffect(() => {
    const canvas = parseTruthy(canvasRef.current)
    canvas.width = canvasRect.width
    canvas.height = canvasRect.height

    regionSelectorRef.current = new RegionSelector(
      rect(vec(0, 0), vec(canvas.width, canvas.height)),
    )
  }, [canvasRect])

  useAnimationLoop(() => {
    const region = regionSelectorRef.current?.region
    if (!region) return

    const canvas = parseTruthy(canvasRef.current)
    const ctx = parseTruthy(canvas.getContext("2d"))

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = ctx.strokeStyle = "#059669"
    ctx.lineWidth = 1

    // add adjustments for a pixel-perfect border
    ctx.globalAlpha = 0.4
    ctx.fillRect(
      ...region.position.plus(vec(1)).components(),
      ...region.size.minus(vec(2, 2)).components(),
    )

    ctx.globalAlpha = 1
    ctx.strokeRect(
      ...region.position.plus(vec(1.5)).components(),
      ...region.size.minus(vec(2, 2)).components(),
    )
  })

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()

    const selector = parseTruthy(regionSelectorRef.current)

    const action = selector.start(
      vec(event.nativeEvent.offsetX, event.nativeEvent.offsetY),
    )

    const canvas = parseTruthy(canvasRef.current)
    const canvasSize = vec(canvas.clientLeft, canvas.clientTop)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault()
      action.update(vec(moveEvent.pageX, moveEvent.pageY).minus(canvasSize))
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
        onPointerDown={handlePointerDown}
        ref={canvasRef}
      />
      <section className="flex gap-3">
        <button className={solidButtonClass}>display 1</button>
        <hr className="bg-slate-700 border-none w-px h-[unset] my-1 mx-auto" />
        <button className={solidButtonClass}>all displays</button>
        <hr className="bg-slate-700 border-none w-px h-[unset] my-1 mx-auto" />
        <button className={solidButtonClass}>save</button>
        <button className={solidButtonClass}>
          copy file (only shows after save)
        </button>
        <hr className="bg-slate-700 border-none w-px h-[unset] my-1 mx-auto" />
        <button className={solidButtonClass}>copy image</button>
      </section>
    </div>
  )
}
