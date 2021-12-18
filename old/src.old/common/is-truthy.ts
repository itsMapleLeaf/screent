import type { Falsy } from "./types"

export const isTruthy = <T>(value: T | Falsy): value is T => !!value
