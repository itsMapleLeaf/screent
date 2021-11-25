import { app, BrowserWindow } from "electron"
import { z } from "zod"
import { isDev } from "../common/constants"
import { safeJsonParse } from "../common/json"
import { getDistPath } from "../common/paths"
import { importExeca } from "./execa"
import { tryRegisterShortcut } from "./try-register-shortcut"

type Region = z.infer<typeof regionSchema>
const regionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

export class VideoRecorder {
  private status: "idle" | "recording" = "idle"

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
      recorder.recordVideo().catch(console.error)
    })

    return recorder
  }

  async recordVideo() {
    if (this.status !== "idle") return
    this.status = "recording"

    const region = await VideoRecorder.getRegion()
    if (region) {
      await this.showWindows(region)
    }

    this.status = "idle"
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

  private static async getRegion(): Promise<Region | undefined> {
    const execa = await importExeca()

    const regionResult = await execa(
      "slop",
      [
        "--highlight",
        "--color=0.3,0.4,0.6,0.4",
        `--format={ "x": %x, "y": %y, "width": %w, "height": %h }`,
      ],
      { reject: false },
    )
    if (regionResult.failed) {
      console.error(regionResult.stderr)
      return
    }

    const regionJson = safeJsonParse(regionResult.stdout)
    if (regionJson instanceof Error) {
      console.error("Invalid region JSON:", regionJson)
      return
    }

    const regionParseResult = regionSchema.safeParse(regionJson)
    if (!regionParseResult.success) {
      console.error("Invalid region data:", regionParseResult.error.issues)
      return
    }

    return regionParseResult.data
  }

  private async showWindows(region: Region) {
    this.regionFrame.setBounds(region)
    this.regionFrame.show()

    this.controls.setBounds({
      x: region.x,
      y: region.y + region.height,
      width: region.width,
      height: 40,
    })
    this.controls.show()
  }
}
