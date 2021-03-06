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

  get width() {
    return this.size.x
  }

  get height() {
    return this.size.y
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

  get center() {
    return this.position.plus(this.size.times(0.5))
  }

  moveTo(position: Vec) {
    return rect(position, this.size)
  }

  moveBy(delta: Vec) {
    return rect(this.position.plus(delta), this.size)
  }

  resizeTo(size: Vec) {
    return rect(this.position, size)
  }

  resizeBy(delta: Vec) {
    return rect(this.position, this.size.plus(delta))
  }

  containsPoint(point: Vec) {
    return point.isInArea(this.topLeft, this.bottomRight)
  }
}

export const rect = (position: Vec, size: Vec) => new Rect(position, size)
