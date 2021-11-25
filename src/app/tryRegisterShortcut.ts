import { globalShortcut, Notification } from "electron"

export function tryRegisterShortcut(
  accelerator: Electron.Accelerator,
  callback: () => void,
) {
  const success = globalShortcut.register(accelerator, callback)
  if (!success) {
    new Notification({
      title: "Couldn't register keybord shortcut",
      body: `Failed to register keyboard shortcut: ${accelerator}`,
    })
  }

  return () => globalShortcut.unregister(accelerator)
}
