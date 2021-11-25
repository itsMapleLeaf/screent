import type { JsonValue } from "type-fest"
import { toError } from "./toError"

export function safeJsonParse(json: string): JsonValue | Error {
  try {
    return JSON.parse(json)
  } catch (error) {
    return toError(error)
  }
}
