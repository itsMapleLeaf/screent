import { app, BrowserWindow, shell } from "electron"
import { createWriteStream } from "fs"
import { mkdir } from "fs/promises"
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

export class VideoRecorder {
  private status: "ready" | "region-select" | "recording" = "ready"

  private constructor(
    private readonly regionFrame: BrowserWindow,
    private readonly controls: BrowserWindow,
  ) {}

  static async create() {
    await app.whenReady()

    const recorder = new VideoRecorder(
      await VideoRecorder.createRecordingFrameWindow(),
      await VideoRecorder.createControlsWindow(),
    )

    tryRegisterShortcut("Meta+Alt+F12", () => {
      recorder.recordVideo().catch(logErrorStack)
    })

    return recorder
  }

  async recordVideo() {
    if (this.status !== "ready") return

    const timestamp = [
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      new Date().getDate(),
      new Date().getHours(),
      new Date().getMinutes(),
      new Date().getSeconds(),
    ].join("-")

    const outputPath = getVideoRecordingsPath(`${appName}-${timestamp}.mp4`)

    try {
      this.status = "region-select"

      const region = await VideoRecorder.getRegion()
      this.showWindows(region)

      this.status = "recording"

      const args = [
        // global options
        `-f x11grab`,
        `-loglevel warning`,

        // input / x11grab options
        `-framerate 30`,
        `-video_size ${region.width}x${region.height}`,
        `-i ${process.env.DISPLAY || ":0"}.0+${region.left},${region.top}`,

        // output options
        `-f mpeg`,
        `-`,
      ]

      const execa = await importExeca()
      const child = execa("ffmpeg", args.map((it) => it.split(/\s+/)).flat())
      child.catch(logErrorStack)

      setTimeout(() => {
        child.stdin!.write("q")
      }, 2000)

      await mkdir(dirname(outputPath), { recursive: true })
      await pipeline([child.stdout!, createWriteStream(outputPath)])

      this.hideWindows()

      shell.showItemInFolder(outputPath)
    } catch (error) {
      if (await isFile(outputPath)) {
        await unlink(outputPath)
      }
      throw error
    } finally {
      this.status = "ready"
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
      win.webContents.openDevTools()
    } else {
      await win.loadFile(getDistPath("renderer/video-recording-frame.html"))
    }

    return win
  }

  private static async createControlsWindow(): Promise<BrowserWindow> {
    const win = new BrowserWindow({
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      fullscreenable: false,
      skipTaskbar: true,
      closable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    })

    // https://github.com/electron/electron/issues/12445#issuecomment-800413955
    win.on("ready-to-show", () => {
      win.setAlwaysOnTop(true)
      win.focus()
    })

    if (isDev) {
      await win.loadURL("http://localhost:3000/video-recording-controls/")
      win.webContents.openDevTools()
    } else {
      await win.loadFile(
        getDistPath("renderer/video-recording-controls/index.html"),
      )
    }

    return win
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

  private showWindows(region: Rect) {
    // size the frame so it doesn't show up in the recording
    this.regionFrame.setBounds({
      x: region.left - 1,
      y: region.top - 1,
      width: region.width + 2,
      height: region.height + 2,
    })
    this.regionFrame.show()

    this.controls.setBounds({
      x: region.left,
      y: region.top + region.height,
      height: 40,
    })
    this.controls.show()
  }

  private hideWindows() {
    this.regionFrame.hide()
    this.controls.hide()
  }
}
