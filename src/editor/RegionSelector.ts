import { Rect } from "../common/Rect"
import { vec, Vec } from "../common/Vec"

export class RegionSelector {
  region?: Rect

  constructor(readonly area: Rect) {}

  start(position: Vec): RegionSelectorAction {
    if (this.region?.containsPoint(position)) {
      return new RegionSelectorMoveAction(
        this,
        position.minus(this.region.position),
      )
    }

    this.region = new Rect(position, vec())
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
    this.selector.region = this.selector.region
      ?.moveTo(Vec.lesser(this.initialPosition, position))
      .resize(this.initialPosition.minus(position))
  }
}

export class RegionSelectorMoveAction implements RegionSelectorAction {
  constructor(
    private readonly selector: RegionSelector,
    private readonly dragOffset: Vec,
  ) {}

  update(position: Vec) {
    this.selector.region = this.selector.region?.moveTo(
      position
        .minus(this.dragOffset)
        .clamp(
          vec(),
          this.selector.area.bottomRight.minus(this.selector.region.size),
        ),
    )
  }
}
