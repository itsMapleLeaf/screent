import type { JsonObject, JsonValue } from "type-fest"

export function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value != null && !Array.isArray(value)
}
