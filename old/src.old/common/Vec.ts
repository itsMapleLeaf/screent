import { clamp } from "./clamp"

export class Vec {
  constructor(readonly x: number, readonly y: number) {}

  plus(other: Vec): Vec {
    return new Vec(this.x + other.x, this.y + other.y)
  }

  minus(other: Vec): Vec {
    return new Vec(this.x - other.x, this.y - other.y)
  }

  times(factor: number): Vec {
    return new Vec(this.x * factor, this.y * factor)
  }

  dividedBy(factor: number): Vec {
    return new Vec(this.x / factor, this.y / factor)
  }

  abs(): Vec {
    return new Vec(Math.abs(this.x), Math.abs(this.y))
  }

  components() {
    return [this.x, this.y] as const
  }

  isInArea(topLeft: Vec, bottomRight: Vec): boolean {
    return (
      this.x >= topLeft.x &&
      this.x <= bottomRight.x &&
      this.y >= topLeft.y &&
      this.y <= bottomRight.y
    )
  }

  clamp(topLeft: Vec, bottomRight: Vec): Vec {
    return new Vec(
      clamp(this.x, topLeft.x, bottomRight.x),
      clamp(this.y, topLeft.y, bottomRight.y),
    )
  }

  static lesser(a: Vec, b: Vec): Vec {
    return new Vec(Math.min(a.x, b.x), Math.min(a.y, b.y))
  }

  static greater(a: Vec, b: Vec): Vec {
    return new Vec(Math.max(a.x, b.x), Math.max(a.y, b.y))
  }
}

export const vec = (x = 0, y = x) => new Vec(x, y)
