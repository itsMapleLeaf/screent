import { dialog } from "electron"
import { toError } from "../common/toError"

export function showErrorDialog(error: unknown) {
  const { stack, message } = toError(error)
  dialog.showErrorBox("Error", stack || message)
}
