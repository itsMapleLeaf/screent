import { BrowserWindow, shell } from "electron"
import type { ExecaChildProcess } from "execa"
import execa from "execa"
import { makeAutoObservable } from "mobx"
import { mkdir, unlink } from "node:fs/promises"
import { dirname } from "node:path"
import { z } from "zod"
import { name as appName } from "../../package.json"
import { isDevelopment } from "../common/constants"
import { isFile } from "../common/fs"
import { isTruthy } from "../common/is-truthy"
import { getDistPath } from "../common/paths"
import type { Rect } from "../common/Rect"
import { rect } from "../common/Rect"
import { vec } from "../common/Vec"
import type { AudioDevice, AudioDeviceSelector } from "./audio-devices"
import { applyDevtoolsListener } from "./devtools"
import { getVideoRecordingsPath } from "./paths"

type VideoRecordingState =
  | { status: "ready" }
  | { status: "preparing" }
  | { status: "recording"; child: ExecaChildProcess; outputPath: string }

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
          audioDeviceSelector.selectedDevice,
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

  await (isDevelopment
    ? win.loadURL("http://localhost:3000/video-recording-frame.html")
    : win.loadFile(getDistPath("renderer/video-recording-frame.html")))

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

async function createRecordingChildProcess(
  region: Rect,
  outputPath: string,
  audioDevice: AudioDevice | undefined,
) {
  const flags: string[] = [
    // global options
    // `-loglevel quiet`,
    `-use_wallclock_as_timestamps 1`,

    // audio input
    audioDevice && [`-f pulse`, `-i ${audioDevice.id}`],

    // video input
    `-f x11grab`,
    `-framerate 25`,
    `-video_size ${region.width}x${region.height}`,
    `-thread_queue_size 128`, // fixes a "thread queue is blocking" warning
    `-i ${process.env.DISPLAY || ":0"}.0+${region.left},${region.top}`,

    // video output options
    `-codec:v libx264`,
    `-preset fast`,
    `-pix_fmt yuv420p`, // allows playback in VLC and other video players

    // audio output options
    audioDevice && [
      `-codec:a libvorbis`,
      `-ac ${audioDevice.channelCount ?? "2"}`,
      `-ar ${audioDevice.sampleRate ?? "48000"}`,
    ],

    outputPath,
  ]
    .flat()
    .filter(isTruthy)

  const child = execa(
    "ffmpeg",
    flags.flatMap((flag) => flag.split(/\s+/)),
    { stdout: "inherit", stderr: "inherit" }, // ffmpeg logs info to stderr for some reason
  )

  // ensure the child doesn't get unwrapped as a promise
  return [child] as const
}

function toNearest(value: number, step: number) {
  return Math.round(value / step) * step
}
