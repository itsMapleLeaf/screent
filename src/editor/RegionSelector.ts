import { observable } from "micro-observables"
import { Rect } from "../common/Rect"
import { vec, Vec } from "../common/Vec"

export class RegionSelector {
  readonly region = observable<Rect | undefined>(undefined)
  readonly area: Rect

  constructor(areaSize: Vec) {
    this.area = new Rect(vec(), areaSize)
  }

  start(position: Vec): RegionSelectorAction {
    const region = this.region.get()
    if (region?.containsPoint(position)) {
      return new RegionSelectorMoveAction(this, position.minus(region.position))
    }

    this.region.set(new Rect(position, vec()))
    return new RegionSelectorCreateAction(this, position)
  }
}

export type RegionSelectorAction = {
  update(position: Vec): void
}

export class RegionSelectorCreateAction implements RegionSelectorAction {
  constructor(
    private readonly selector: RegionSelector,
    private readonly initialPosition: Vec,
  ) {}

  update(position: Vec) {
    position = position.clamp(
      this.selector.area.topLeft,
      this.selector.area.bottomRight,
    )

    this.selector.region.update((region) =>
      region
        ?.moveTo(Vec.lesser(this.initialPosition, position))
        .resize(this.initialPosition.minus(position).abs()),
    )
  }
}

export class RegionSelectorMoveAction implements RegionSelectorAction {
  constructor(
    private readonly selector: RegionSelector,
    private readonly dragOffset: Vec,
  ) {}

  update(position: Vec) {
    this.selector.region.update((region) =>
      region?.moveTo(
        position
          .minus(this.dragOffset)
          .clamp(vec(), this.selector.area.bottomRight.minus(region.size)),
      ),
    )
  }
}
