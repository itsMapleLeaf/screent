import { app, BrowserWindow } from "electron"
import { z } from "zod"
import { safeJsonParse } from "../common/json"
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

  private constructor(private readonly recordingFrame: BrowserWindow) {}

  static async create() {
    await app.whenReady()

    const recordingFrame = await VideoRecorder.createRecordingFrameWindow()
    const recorder = new VideoRecorder(recordingFrame)

    tryRegisterShortcut("Meta+Alt+F12", () => {
      recorder.recordVideo().catch(console.error)
    })

    return recorder
  }

  private static async createRecordingFrameWindow() {
    const win = new BrowserWindow({
      show: false,
      frame: false,
    })
    return win
  }

  async recordVideo() {
    if (this.status !== "idle") return
    this.status = "recording"

    const region = await VideoRecorder.getRegion()
    if (!region) return

    await this.applyRegionToRecordingFrame(region)

    this.status = "idle"
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

  private async applyRegionToRecordingFrame(region: Region) {
    this.recordingFrame.setBounds(region)
    this.recordingFrame.show()
  }
}
