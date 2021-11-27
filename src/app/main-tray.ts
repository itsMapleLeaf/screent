import { Menu, Tray } from "electron"
import { name as appName } from "../../package.json"
import { isDev } from "../common/constants"
import { logErrorStack } from "../common/errors"
import { getAssetPath } from "../common/paths"
import { hideDevtools, showDevtools } from "./devtools"
import type { VideoRecorder, VideoRecordingState } from "./video-recorder"

export function createMainTray(recorder: VideoRecorder) {
  const tray = new Tray(getAssetPath("icon.png"))
  tray.setTitle(appName)
  tray.setToolTip(appName)

  updateMenu(recorder.state.get())
  recorder.state.subscribe(updateMenu)

  function updateMenu(state: VideoRecordingState) {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: `${appName} - ${state.status}`, enabled: false },

        { type: "separator" },

        {
          label: "Start Recording",
          visible: state.status === "ready",
          click: () => {
            recorder.startRecording().catch(logErrorStack)
          },
        },
        {
          label: "Stop Recording",
          visible: state.status === "recording",
          click: recorder.stopRecording,
        },

        { visible: isDev, type: "separator" },
        { visible: isDev, label: "Show Devtools", click: showDevtools },
        { visible: isDev, label: "Hide Devtools", click: hideDevtools },

        { type: "separator" },

        { role: "quit" },
      ]),
    )
  }
}
