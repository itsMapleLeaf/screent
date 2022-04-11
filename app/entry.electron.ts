import { app, dialog } from "electron"
import { getErrorStack, logErrorStack } from "./common/errors"

async function main() {
  try {
    await app.whenReady()
    const { setupApp } = await import("./main/setup-app")
    await setupApp()
  } catch (error) {
    if (app.isPackaged) {
      dialog.showErrorBox("Error", getErrorStack(error))
    }
    logErrorStack(error)
    app.quit()
  }
}
main()
