import type { Vec } from "./Vec"
import { vec } from "./Vec"

export class Rect {
  constructor(readonly position: Vec, readonly size: Vec) {}

  get left() {
    return this.position.x
  }

  get right() {
    return this.position.x + this.size.x
  }

  get top() {
    return this.position.y
  }

  get bottom() {
    return this.position.y + this.size.y
  }

  get center() {
    return vec(this.left + this.size.x / 2, this.top + this.size.y / 2)
  }

  get topLeft() {
    return this.position
  }

  get topRight() {
    return vec(this.right, this.top)
  }

  get bottomLeft() {
    return vec(this.left, this.bottom)
  }

  get bottomRight() {
    return vec(this.right, this.bottom)
  }

  moveTo(position: Vec) {
    return rect(position, this.size)
  }

  moveBy(delta: Vec) {
    return rect(this.position.plus(delta), this.size)
  }

  resize(size: Vec) {
    return rect(this.position, size)
  }

  containsPoint(point: Vec) {
    return point.isInArea(this.topLeft, this.bottomRight)
  }
}

export const rect = (position: Vec, size: Vec) => new Rect(position, size)
