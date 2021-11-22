import React, { useEffect, useRef } from "react"
import { parseTruthy } from "../common/assert"
import { vec, Vec } from "../common/Vec"
import { solidButtonClass } from "./components"
import { useAnimationLoop } from "./useAnimationLoop"
import { useElementRect } from "./useElementRect"

type Region = {
  position: Vec
  size: Vec
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

    const region = (regionRef.current ??= {
      position: vec(),
      size: vec(),
    })

    const initialPointerPosition = vec(
      event.nativeEvent.offsetX,
      event.nativeEvent.offsetY,
    )

    const initialOffset = initialPointerPosition.minus(region.position)

    const isInCurrentRegion = initialPointerPosition.isInArea(
      region.position,
      region.position.plus(region.size),
    )

    const dragAction = isInCurrentRegion ? "move" : "draw"

    if (dragAction === "draw") {
      region.position = initialPointerPosition
      region.size = vec()
    }

    const canvas = event.currentTarget
    const canvasPosition = vec(canvas.offsetLeft, canvas.offsetTop)
    const canvasSize = vec(canvas.clientWidth, canvas.clientHeight)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault()

      const pointerPosition = vec(moveEvent.pageX, moveEvent.pageY)
        .minus(canvasPosition)
        .clamp(vec(), canvasSize)

      if (dragAction === "draw") {
        region.position = Vec.lesser(initialPointerPosition, pointerPosition)
        region.size = initialPointerPosition.minus(pointerPosition).abs()
      }

      if (dragAction === "move") {
        region.position = pointerPosition
          .minus(initialOffset)
          .clamp(vec(), canvasSize.minus(region.size))
      }
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
