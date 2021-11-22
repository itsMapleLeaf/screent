import { Menu, Tray } from "electron"
import { name as appName } from "../../package.json"
import { getAssetPath } from "../common/getAssetPath"
import type { Editor } from "./editor"

export class TrayManager {
  private tray?: Tray

  constructor(private readonly editor: Editor) {}

  create() {
    this.tray = new Tray(getAssetPath("icon.png"))
    this.tray.setTitle(appName)
    this.tray.setToolTip(appName)
    this.tray.setContextMenu(this.createMenu())
  }

  private createMenu() {
    return Menu.buildFromTemplate([
      {
        label: "debug: show editor window",
        click: () => this.editor.showWindow(),
      },
    ])
  }
}
