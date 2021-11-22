import React, { useEffect, useRef } from "react"
import { parseTruthy } from "../common/assert"
import { clamp } from "../common/clamp"
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

    // add adjustments for a pixel-perfect border
    ctx.globalAlpha = 0.4
    ctx.fillRect(
      region.x + 1,
      region.y + 1,
      region.width - 2,
      region.height - 2,
    )

    ctx.globalAlpha = 1
    ctx.strokeRect(
      region.x + 1.5,
      region.y + 1.5,
      region.width - 2,
      region.height - 2,
    )
  })

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()

    const canvas = event.currentTarget
    const { offsetX, offsetY } = event.nativeEvent

    const region = (regionRef.current ??= {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })

    const initialOffset = {
      x: offsetX - region.x,
      y: offsetY - region.y,
    }

    const isInCurrentRegion =
      offsetX >= region.x &&
      offsetY >= region.y &&
      offsetX <= region.x + region.width &&
      offsetY <= region.y + region.height

    const dragAction = isInCurrentRegion ? "move" : "draw"

    if (dragAction === "draw") {
      region.x = offsetX
      region.y = offsetY
      region.width = 0
      region.height = 0
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault()

      const localX = clamp(
        moveEvent.pageX - canvas.offsetLeft,
        0,
        canvas.clientWidth,
      )

      const localY = clamp(
        moveEvent.pageY - canvas.offsetTop,
        0,
        canvas.clientHeight,
      )

      if (dragAction === "draw") {
        region.x = Math.min(offsetX, localX)
        region.y = Math.min(offsetY, localY)
        region.width = Math.abs(offsetX - localX)
        region.height = Math.abs(offsetY - localY)
      }

      if (dragAction === "move") {
        region.x = clamp(
          localX - initialOffset.x,
          0,
          canvas.clientWidth - region.width,
        )
        region.y = clamp(
          localY - initialOffset.y,
          0,
          canvas.clientHeight - region.height,
        )
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
