import { BrowserWindow, shell } from "electron"
import type { ExecaChildProcess } from "execa"
import { makeAutoObservable } from "mobx"
import { mkdir, unlink } from "node:fs/promises"
import { dirname } from "node:path"
import { z } from "zod"
import { name as appName } from "../../package.json"
import { isDev } from "../common/constants"
import { isFile } from "../common/fs"
import { getDistPath } from "../common/paths"
import type { Rect } from "../common/Rect"
import { rect } from "../common/Rect"
import { vec } from "../common/Vec"
import { audioDeviceSetting } from "./audio-devices"
import { applyDevtoolsListener } from "./devtools"
import { getVideoRecordingsPath } from "./paths"

// execa is an ES module, and can't be required normally
const execaPromise = import("execa")

export type VideoRecordingState =
  | { status: "ready" }
  | { status: "preparing" }
  | { status: "recording"; child: ExecaChildProcess; outputPath: string }

export type VideoRecorder = Awaited<ReturnType<typeof createVideoRecorder>>

export async function createVideoRecorder() {
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

  return makeAutoObservable({
    state: { status: "ready" } as VideoRecordingState,
    async startRecording() {
      if (this.state.status !== "ready") {
        return
      }

      this.state = { status: "preparing" }

      let outputPath: string | undefined

      try {
        outputPath = await ensureRecordingOutputPath()
        const region = await selectRegion()

        const [child] = await createRecordingChildProcess(
          region,
          outputPath,
          typeof audioDeviceSetting.value === "string"
            ? audioDeviceSetting.value
            : "default",
        )

        this.state = { status: "recording", child, outputPath }
        showRegionWindow(region)

        await child

        shell.showItemInFolder(outputPath)
      } catch (error) {
        if (outputPath && (await isFile(outputPath))) {
          await unlink(outputPath)
        }
        throw error
      } finally {
        this.state = { status: "ready" }
        hideRegionWindow()
      }
    },

    stopRecording() {
      if (this.state.status === "recording") {
        this.state.child.stdin!.write("q")
      }
      hideRegionWindow()
    },

    async toggleRecording() {
      if (this.state.status === "ready") {
        await this.startRecording()
      } else {
        this.stopRecording()
      }
    },
  })
}

async function createRegionWindow() {
  const win = new BrowserWindow({
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

  if (isDev) {
    await win.loadURL("http://localhost:3000/video-recording-frame.html")
  } else {
    await win.loadFile(getDistPath("renderer/video-recording-frame.html"))
  }

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

  const path = `${appName}-${timestamp}.mp4`
  await mkdir(dirname(path), { recursive: true })
  return getVideoRecordingsPath(path)
}

async function selectRegion(): Promise<Rect> {
  const { execa } = await execaPromise

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
    // rounding to the nearest 16 can keep the ffmpeg encoder from crashing
    vec(toNearest(region.width, 16), toNearest(region.height, 16)),
  )
}

async function createRecordingChildProcess(
  region: Rect,
  outputPath: string,
  audioDeviceId: string,
) {
  const { execa } = await execaPromise

  const args = [
    // video input
    `-f x11grab`,
    `-framerate 30`,
    `-video_size ${region.width}x${region.height}`,
    `-thread_queue_size 128`, // fixes a "thread queue is blocking" warning
    `-i ${process.env.DISPLAY || ":0"}.0+${region.left},${region.top}`,

    // audio input
    `-f pulse`,
    `-i ${audioDeviceId}`,

    // output options
    `-codec:v libx264`,
    `-pix_fmt yuv420p`, // allows playback in VLC
    `-preset slow`,

    `-codec:a libopus`,
    `-ac 2`,

    outputPath,
  ]

  const child = execa(
    "ffmpeg",
    args.flatMap((arg) => arg.split(/\s+/)),
    { stdout: "inherit", stderr: "inherit" }, // ffmpeg logs info to stderr for some reason
  )

  // ensure the child doesn't get unwrapped as a promise
  return [child] as const
}

function toNearest(value: number, step: number) {
  return Math.round(value / step) * step
}
