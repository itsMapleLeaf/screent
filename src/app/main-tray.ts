import { Menu, Tray } from "electron"
import { autorun } from "mobx"
import { name as appName } from "../../package.json"
import { isDev } from "../common/constants"
import { logErrorStack } from "../common/errors"
import { getAssetPath } from "../common/paths"
import { joinContentfulStrings } from "../common/string"
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
          label: "Select Audio Device",
          visible:
            recorder.state.status === "ready" &&
            audioDeviceSelector.devices.length > 0,
          submenu: audioDeviceSelector.devices.map((device) => ({
            type: "checkbox",
            label: joinContentfulStrings(
              [device.name, device.muted && "(muted)"],
              " ",
            ),
            checked: device.id === audioDeviceSelector.selectedDevice?.id,
            enabled: device.alsaString != null, // can't play it if there's no alsa string
            click: () => {
              if (device.id) {
                audioDeviceSelector.select(device.id)
              }
            },
          })),
        },

        {
          label: "Stop Recording",
          visible: recorder.state.status === "recording",
          click: recorder.stopRecording,
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
