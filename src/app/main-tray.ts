import { Menu, Tray } from "electron"
import { autorun } from "mobx"
import { name as appName } from "../../package.json"
import { isDev } from "../common/constants"
import { logErrorStack } from "../common/errors"
import { getAssetPath } from "../common/paths"
import type { AudioDeviceSelector } from "./audio-devices"
import { hideDevtools, showDevtools } from "./devtools"
import type { VideoRecorder } from "./video-recorder"

export function createMainTray(
  recorder: VideoRecorder,
  audioDeviceSelector: AudioDeviceSelector,
) {
  const tray = new Tray(getAssetPath("icon.png"))
  tray.setTitle(appName)
  tray.setToolTip(appName)

  autorun(() => {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        // app header
        { label: `${appName} - ${recorder.state.status}`, enabled: false },

        // recording
        { type: "separator" },
        {
          label: "Start Recording",
          visible: recorder.state.status === "ready",
          click: () => {
            recorder.startRecording().catch(logErrorStack)
          },
        },
        {
          label: "Stop Recording",
          visible: recorder.state.status === "recording",
          click: recorder.stopRecording,
        },
        {
          label: "Select Audio Device",
          submenu: audioDeviceSelector.devices.map((device) => ({
            label: device.name,
            type: "radio",
            checked: device.id === audioDeviceSelector.selectedDeviceId,
            enabled: device.id !== undefined,
            click: () => {
              audioDeviceSelector.setDevice(device.id)
            },
          })),
        },

        // dev options
        { visible: isDev, type: "separator" },
        { visible: isDev, label: "Show Devtools", click: showDevtools },
        { visible: isDev, label: "Hide Devtools", click: hideDevtools },

        { type: "separator" },

        { role: "quit" },
      ]),
    )
  })
}
