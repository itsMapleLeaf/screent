import { app, Menu, Tray } from "electron"
import { name as appName } from "../../package.json"
import { getAssetPath } from "../common/paths"
import type { Editor } from "./editor"

export class MainTray {
  constructor(private readonly tray: Tray, private readonly editor: Editor) {}

  static async create(editor: Editor) {
    await app.whenReady()

    const tray = new Tray(getAssetPath("icon.png"))
    tray.setTitle(appName)
    tray.setToolTip(appName)

    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "debug: show editor window",
          click: () => editor.showWindow(),
        },
      ]),
    )

    return new MainTray(tray, editor)
  }
}
