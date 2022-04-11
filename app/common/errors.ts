export function toError(value: unknown): Error {
  if (value instanceof Error) return value
  return new Error(String(value))
}

export function getErrorStack(error: unknown): string {
  const { stack, message } = toError(error)
  return stack || message
}

export function logErrorStack(error: unknown) {
  console.error(getErrorStack(error))
}

export function raise(value: unknown): never {
  throw toError(value)
}
