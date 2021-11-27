import type { Falsy } from "./types"

export function joinContentfulStrings(
  strings: Array<string | Falsy>,
  separator: string,
): string {
  return strings.filter(Boolean).join(separator)
}
