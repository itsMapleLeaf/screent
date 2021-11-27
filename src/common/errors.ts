export function toError(value: unknown): Error {
  if (value instanceof Error) return value
  return new Error(String(value))
}

export function logErrorStack(error: unknown) {
  const { stack, message } = toError(error)
  console.error(stack || message)
}

export function raise(value: unknown): never {
  throw toError(value)
}
