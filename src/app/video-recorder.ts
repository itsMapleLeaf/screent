import { BrowserWindow, shell } from "electron"
import type { ExecaChildProcess } from "execa"
import { createWriteStream } from "fs"
import { mkdir } from "fs/promises"
import { observable } from "micro-observables"
import { unlink } from "node:fs/promises"
import { dirname } from "path"
import { pipeline } from "stream/promises"
import { z } from "zod"
import { name as appName } from "../../package.json"
import { isDev } from "../common/constants"
import { isFile } from "../common/isFile"
import { logErrorStack } from "../common/logErrorStack"
import { getDistPath } from "../common/paths"
import type { Rect } from "../common/Rect"
import { rect } from "../common/Rect"
import { vec } from "../common/Vec"
import { importExeca } from "./execa"
import { getVideoRecordingsPath } from "./paths"
import { tryRegisterShortcut } from "./try-register-shortcut"

export type VideoRecorderState =
  | { status: "ready" }
  | { status: "preparing" }
  | { status: "recording"; process: ExecaChildProcess; outputPath: string }

export class VideoRecorder {
  readonly state = observable<VideoRecorderState>({ status: "ready" })

  private constructor(private readonly regionFrame: BrowserWindow) {}

  static async create() {
    const recorder = new VideoRecorder(
      await VideoRecorder.createRecordingFrameWindow(),
    )

    tryRegisterShortcut("Meta+Alt+F12", () => {
      if (recorder.isReady()) {
        recorder.startRecording().catch(logErrorStack)
      }

      if (recorder.isRecording()) {
        recorder.stopRecording()
      }
    })

    return recorder
  }

  isReady() {
    return this.state.get().status === "ready"
  }

  isRecording() {
    return this.state.get().status === "recording"
  }

  async startRecording() {
    if (this.state.get().status !== "ready") return
    this.state.set({ status: "preparing" })

    const outputPath = VideoRecorder.getRecordingOutputPath()

    try {
      const region = await VideoRecorder.getRegion()
      this.showWindows(region)

      const [child] = await VideoRecorder.runRecordingProcess(region)

      this.state.set({ status: "recording", process: child, outputPath })

      await mkdir(dirname(outputPath), { recursive: true })
      await pipeline([child.stdout!, createWriteStream(outputPath)])
    } catch (error) {
      if (await isFile(outputPath)) {
        await unlink(outputPath)
      }
      throw error
    } finally {
      this.state.set({ status: "ready" })
    }
  }

  stopRecording() {
    const state = this.state.get()
    if (state.status !== "recording") return
    state.process.stdin!.write("q")
    shell.showItemInFolder(state.outputPath)
    this.hideWindows()
    this.state.set({ status: "ready" })
  }

  private static async createRecordingFrameWindow() {
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

    if (isDev) {
      await win.loadURL("http://localhost:3000/video-recording-frame.html")
      win.webContents.openDevTools()
    } else {
      await win.loadFile(getDistPath("renderer/video-recording-frame.html"))
    }

    return win
  }

  private static getRecordingOutputPath() {
    const timestamp = [
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      new Date().getDate(),
      new Date().getHours(),
      new Date().getMinutes(),
      new Date().getSeconds(),
    ].join("-")
    return getVideoRecordingsPath(`${appName}-${timestamp}.avi`)
  }

  private static async getRegion(): Promise<Rect> {
    const execa = await importExeca()

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

  private static async runRecordingProcess(
    region: Rect,
  ): Promise<[ExecaChildProcess<string>]> {
    const args = [
      // global options
      `-f x11grab`,
      `-loglevel warning`,

      // input / x11grab options
      `-framerate 30`,
      `-video_size ${region.width}x${region.height}`,
      `-i ${process.env.DISPLAY || ":0"}.0+${region.left},${region.top}`,

      // output options
      `-qscale 0`,
      `-vcodec huffyuv`,
      `-f avi`,
      `-`,
    ]

    const execa = await importExeca()
    const child = execa("ffmpeg", args.map((it) => it.split(/\s+/)).flat())
    child.catch(logErrorStack)
    return [child]
  }

  private showWindows(region: Rect) {
    // size the frame so it doesn't show up in the recording
    this.regionFrame.setBounds({
      x: region.left - 1,
      y: region.top - 1,
      width: region.width + 2,
      height: region.height + 2,
    })
    this.regionFrame.show()
  }

  private hideWindows() {
    this.regionFrame.hide()
  }
}
