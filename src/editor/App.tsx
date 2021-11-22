import { useObservable } from "micro-observables"
import React, { useMemo, useRef } from "react"
import { parseTruthy } from "../common/assert"
import { vec } from "../common/Vec"
import { solidButtonClass } from "./components"
import { RegionSelector } from "./RegionSelector"
import { useElementRect } from "./useElementRect"

export function App() {
  const regionSelectorElementRef = useRef<HTMLCanvasElement>(null)
  const regionSelectorElementRect = useElementRect(regionSelectorElementRef)

  const regionSelector = useMemo(
    () =>
      new RegionSelector(
        vec(regionSelectorElementRect.width, regionSelectorElementRect.height),
      ),
    [regionSelectorElementRect.width, regionSelectorElementRect.height],
  )

  const region = useObservable(regionSelector.region)

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()

    const action = regionSelector.start(
      vec(event.nativeEvent.offsetX, event.nativeEvent.offsetY),
    )

    const canvas = parseTruthy(regionSelectorElementRef.current)
    const canvasPosition = vec(canvas.offsetLeft, canvas.offsetTop)

    const updateDrag = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault()
      action.update(vec(moveEvent.pageX, moveEvent.pageY).minus(canvasPosition))
    }

    const finishDrag = (event: Event) => {
      event.preventDefault()
      window.removeEventListener("pointermove", updateDrag)
      window.removeEventListener("pointerup", finishDrag)
      window.removeEventListener("blur", finishDrag)
    }

    window.addEventListener("pointermove", updateDrag)
    window.addEventListener("pointerup", finishDrag)
    window.addEventListener("blur", finishDrag)
  }

  return (
    <div className="flex flex-col h-full gap-3 p-3">
      <section
        className="relative flex-1 rounded-md select-none bg-slate-800"
        onPointerDown={handlePointerDown}
        ref={regionSelectorElementRef}
      >
        {region && (
          <div
            className="pointer-events-none border-emerald-700 bg-emerald-700/50 border-[1px]"
            style={{
              position: "absolute",
              left: region.left,
              top: region.top,
              width: region.width,
              height: region.height,
            }}
          />
        )}
      </section>
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
