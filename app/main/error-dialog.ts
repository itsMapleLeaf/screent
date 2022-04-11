import { dialog } from "electron"
import { toError } from "../common/errors"

export function showErrorDialog(error: unknown) {
  const { stack, message } = toError(error)
  dialog.showErrorBox("Error", stack || message)
}
