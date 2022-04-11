import { raise } from "./errors"
import type { Falsy } from "./types"

export function parseTruthy<T>(value: T | Falsy): T {
  return value || raise("value is falsy")
}
