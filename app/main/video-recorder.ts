import { shell } from "electron"
import { makeAutoObservable } from "mobx"
import { mkdir, unlink } from "node:fs/promises"
import { dirname } from "node:path"
import { createRemixBrowserWindow } from "remix-electron"
import { z } from "zod"
import { name as appName } from "../../package.json"
import { isFile } from "../common/fs"
import type { Rect } from "../common/Rect"
import { rect } from "../common/Rect"
import { vec } from "../common/Vec"
import type { AudioDeviceSelector } from "./audio-devices"
import { applyDevtoolsListener } from "./devtools"
import { getVideoRecordingsPath } from "./paths"
import { VideoRecordingProcess } from "./video-recording-process"

// execa is an ES module, and can't be required normally
const execaPromise = import("execa")

type VideoRecordingState =
  | { status: "ready" }
  | { status: "preparing" }
  | { status: "recording"; process: VideoRecordingProcess; outputPath: string }

export type VideoRecorder = Awaited<ReturnType<typeof createVideoRecorder>>

export async function createVideoRecorder(
  audioDeviceSelector: AudioDeviceSelector,
) {
  const regionWindow = await createRegionWindow()

  function showRegionWindow(region: Rect) {
    regionWindow.setBounds({
      x: region.left - 1,
      y: region.top - 1,
      width: region.width + 2,
      height: region.height + 2,
    })
    regionWindow.show()
  }

  function hideRegionWindow() {
    regionWindow.hide()
  }

  const recorder = makeAutoObservable({
    state: { status: "ready" } as VideoRecordingState,
    async startRecording() {
      if (recorder.state.status !== "ready") {
        return
      }

      recorder.state = { status: "preparing" }

      let outputPath: string | undefined

      try {
        outputPath = await ensureRecordingOutputPath()
        const region = await selectRegion()

        const recordingProcess = new VideoRecordingProcess(
          region,
          outputPath,
          audioDeviceSelector.selectedDevice,
        )

        recorder.state = {
          status: "recording",
          process: recordingProcess,
          outputPath,
        }
        showRegionWindow(region)

        await recordingProcess.whenDone()

        shell.showItemInFolder(outputPath)
      } catch (error) {
        if (outputPath && (await isFile(outputPath))) {
          await unlink(outputPath)
        }
        throw error
      } finally {
        recorder.state = { status: "ready" }
        hideRegionWindow()
      }
    },

    stopRecording() {
      if (recorder.state.status === "recording") {
        recorder.state.process.stop()
      }
      hideRegionWindow()
    },

    async toggleRecording() {
      if (recorder.state.status === "ready") {
        await recorder.startRecording()
      } else {
        recorder.stopRecording()
      }
    },
  })
  return recorder
}

async function createRegionWindow() {
  const win = await createRemixBrowserWindow({
    initialRoute: "/video-recording-frame",
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    focusable: false,
    fullscreenable: false,
    skipTaskbar: true,
    closable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.setIgnoreMouseEvents(true)

  // https://github.com/electron/electron/issues/12445#issuecomment-800413955
  win.on("ready-to-show", () => {
    win.setAlwaysOnTop(true)
    win.focus()
  })

  applyDevtoolsListener(win)

  return win
}

async function ensureRecordingOutputPath() {
  const timestamp = [
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate(),
    new Date().getHours(),
    new Date().getMinutes(),
    new Date().getSeconds(),
  ].join("-")

  const path = getVideoRecordingsPath(`${appName}-${timestamp}.mp4`)
  await mkdir(dirname(path), { recursive: true })
  return path
}

async function selectRegion(): Promise<Rect> {
  const { default: execa } = await execaPromise

  const result = await execa("slop", [
    "--highlight",
    "--color=0.3,0.4,0.6,0.4",
    `--format={ "x": %x, "y": %y, "width": %w, "height": %h }`,
  ])

  const regionSchema = z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })

  const region = regionSchema.parse(JSON.parse(result.stdout))

  return rect(
    vec(region.x, region.y),
    vec(toNearest(region.width, 2), toNearest(region.height, 2)),
  )
}

function toNearest(value: number, step: number) {
  return Math.round(value / step) * step
}
