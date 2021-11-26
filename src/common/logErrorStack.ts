import { toError } from "./toError"

export function logErrorStack(error: unknown) {
  const { stack, message } = toError(error)
  console.error(stack || message)
}
