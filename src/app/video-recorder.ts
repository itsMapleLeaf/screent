import { BrowserWindow, shell } from "electron"
import type { ExecaChildProcess } from "execa"
import { observable } from "micro-observables"
import { mkdir, unlink } from "node:fs/promises"
import { dirname } from "node:path"
import { z } from "zod"
import { name as appName } from "../../package.json"
import { isDev } from "../common/constants"
import { isFile } from "../common/isFile"
import { logErrorStack } from "../common/logErrorStack"
import { getDistPath } from "../common/paths"
import type { Rect } from "../common/Rect"
import { rect } from "../common/Rect"
import { vec } from "../common/Vec"
import { applyDevtoolsListener } from "./devtools"
import { getVideoRecordingsPath } from "./paths"
import { tryRegisterShortcut } from "./try-register-shortcut"

// execa is an ES module, and can't be required normally
const execaPromise = import("execa")

export type VideoRecorderState =
  | { status: "ready" }
  | { status: "preparing" }
  | { status: "recording"; process: VideoRecorderProcess; outputPath: string }

export class VideoRecorder {
  readonly state = observable<VideoRecorderState>({ status: "ready" })

  private constructor(private readonly regionFrame: BrowserWindow) {}

  static async create() {
    const frameWindow = await VideoRecorder.createRecordingFrameWindow()
    applyDevtoolsListener(frameWindow)

    const recorder = new VideoRecorder(frameWindow)

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

    let outputPath: string | undefined

    try {
      outputPath = await VideoRecorder.ensureRecordingOutputPath()
      const region = await VideoRecorder.selectRegion()
      const process = new VideoRecorderProcess()

      this.state.set({ status: "recording", process, outputPath })
      this.showWindows(region)

      await process.start(region, outputPath)

      shell.showItemInFolder(outputPath)
    } catch (error) {
      if (outputPath && (await isFile(outputPath))) {
        await unlink(outputPath)
      }
      throw error
    } finally {
      this.state.set({ status: "ready" })
      this.hideWindows()
    }
  }

  stopRecording() {
    const state = this.state.get()
    if (state.status === "recording") {
      state.process.stop()
    }
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
    } else {
      await win.loadFile(getDistPath("renderer/video-recording-frame.html"))
    }

    return win
  }

  private static async selectRegion(): Promise<Rect> {
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

  private static async ensureRecordingOutputPath() {
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

class VideoRecorderProcess {
  private child?: ExecaChildProcess

  async start(region: Rect, outputPath: string) {
    const { execaCommand } = await execaPromise

    this.child = execaCommand(
      [
        "ffmpeg",

        // global options
        `-f x11grab`,
        `-hide_banner`,

        // input options
        `-framerate 30`,
        `-video_size ${region.width}x${region.height}`,
        `-i ${process.env.DISPLAY || ":0"}.0+${region.left},${region.top}`,

        // output options
        // I've tried using x265,
        // but that outputs the x265 cli banner in the output file itself,
        // which corrupts it for certain video players,
        // so sticking with x264 for now
        `-vcodec libx264`,
        outputPath,
      ].join(" "),
      { stdout: "inherit" },
    )

    await this.child
  }

  stop() {
    this.child?.stdin!.write("q")
    this.child = undefined
  }
}
