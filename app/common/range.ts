export function range(start: number, end: number, step: number = 1): number[] {
  if (start === end) {
    return [start]
  }
  if (step === 0) {
    throw new Error("Step cannot be 0")
  }
  const result: number[] = []
  for (
    let value = start;
    step > 0 ? value <= end : value >= end;
    value += step
  ) {
    result.push(value)
  }
  return result
}
