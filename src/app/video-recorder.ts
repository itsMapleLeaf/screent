import { BrowserWindow, shell } from "electron"
import type { ExecaChildProcess } from "execa"
import { observable } from "micro-observables"
import { mkdir, unlink } from "node:fs/promises"
import { dirname } from "node:path"
import { z } from "zod"
import { name as appName } from "../../package.json"
import { isDev } from "../common/constants"
import { isFile } from "../common/isFile"
import { getDistPath } from "../common/paths"
import type { Rect } from "../common/Rect"
import { rect } from "../common/Rect"
import { vec } from "../common/Vec"
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
  const state = observable<VideoRecordingState>({ status: "ready" })
  const regionWindow = await createRegionWindow()

  async function startRecording() {
    if (state.get().status !== "ready") {
      return
    }

    state.set({ status: "preparing" })

    let outputPath: string | undefined

    try {
      outputPath = await ensureRecordingOutputPath()
      const region = await selectRegion()
      const [child] = await createRecordingChildProcess(region, outputPath)

      state.set({ status: "recording", child, outputPath })
      showRegionWindow(region)

      await child

      shell.showItemInFolder(outputPath)
    } catch (error) {
      if (outputPath && (await isFile(outputPath))) {
        await unlink(outputPath)
      }
      throw error
    } finally {
      state.set({ status: "ready" })
      hideRegionWindow()
    }
  }

  function stopRecording() {
    const current = state.get()
    if (current.status === "recording") {
      current.child.stdin!.write("q")
    }

    hideRegionWindow()
  }

  async function toggleRecording() {
    if (state.get().status === "ready") {
      await startRecording()
    } else {
      stopRecording()
    }
  }

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

  return {
    state: state.readOnly(),
    startRecording,
    stopRecording,
    toggleRecording,
  }
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

  return rect(vec(region.x, region.y), vec(region.width, region.height))
}

async function createRecordingChildProcess(region: Rect, outputPath: string) {
  const { execa } = await execaPromise

  const args = [
    // video input options
    `-f x11grab`,
    `-hide_banner`,
    `-framerate 30`,
    `-video_size ${region.width}x${region.height}`,
    `-i ${process.env.DISPLAY || ":0"}.0+${region.left},${region.top}`,

    // audio input options (pulseaudio)
    `-f pulse`,
    `-i alsa_output.usb-Generic_TX-Hifi_Type_C_Audio-00.analog-stereo.monitor`,

    // output options
    // I've tried using x265,
    // but that outputs the x265 cli banner in the output file itself,
    // which corrupts it for certain video players,
    // so sticking with x264 for now
    `-vcodec libx264`,
    outputPath,
  ]

  const child = execa(
    "ffmpeg",
    args.flatMap((arg) => arg.split(/\s+/)),
    { stdout: "inherit" },
  )

  // ensure the child doesn't get unwrapped as a promise
  return [child] as const
}
