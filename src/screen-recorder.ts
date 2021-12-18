import { execa, ExecaChildProcess } from "execa"
import { rm } from "fs/promises"
import { makeAutoObservable, observable, runInAction, when } from "mobx"
import { join, parse } from "path"
import { Region } from "./select-screen-region.js"

export type ScreenRecorderState =
  | { status: "idle" }
  | {
      status: "recording"
      videoProcess?: ExecaChildProcess
      audioProcess?: ExecaChildProcess
    }

export class ScreenRecorder {
  state: ScreenRecorderState = { status: "idle" }

  constructor() {
    makeAutoObservable(this, {
      state: observable.ref,
    })
  }

  async start(region: Region, outputPath: string) {
    const { dir, base, ext } = parse(outputPath)
    const tempVideoPath = join(dir, `${base}-temp${ext}`)
    const tempAudioPath = join(dir, `${base}-temp.ogg`)

    const videoProcess = execa(
      "ffmpeg",
      cliArgs([
        "-y",

        `-f x11grab`,
        `-framerate 25`,
        `-video_size ${region.width}x${region.height}`,
        `-thread_queue_size 128`, // fixes a "thread queue is blocking" warning
        `-i ${process.env.DISPLAY || ":0"}.0+${region.left},${region.top}`,

        `-codec:v libx264`,
        `-preset fast`,
        `-pix_fmt yuv420p`, // allows playback in VLC and other video players

        tempVideoPath,
      ]),
    )

    const audioProcess = execa(
      "ffmpeg",
      cliArgs([
        "-y",

        `-f pulse`,
        `-i alsa_output.usb-Generic_TX-Hifi_Type_C_Audio-00.analog-stereo.monitor`,

        `-codec:a libvorbis`,
        `-ac 2`,
        `-ar 44100`,

        tempAudioPath,
      ]),
    )

    this.state = {
      status: "recording",
      videoProcess,
      audioProcess,
    }

    try {
      await Promise.all([videoProcess, audioProcess])
      await execa(
        "ffmpeg",
        cliArgs([
          "-y",
          `-i ${tempVideoPath}`,
          `-i ${tempAudioPath}`,
          `-codec:v copy`,
          `-codec:a copy`,
          outputPath,
        ]),
      )
    } finally {
      videoProcess.kill()
      audioProcess.kill()
      rm(tempVideoPath).catch(console.error)
      rm(tempAudioPath).catch(console.error)

      runInAction(() => {
        this.state = { status: "idle" }
      })
    }
  }

  stop() {
    if (this.state.status === "recording") {
      this.state.videoProcess?.stdin!.end("q")
      this.state.audioProcess?.stdin!.end("q")
      this.state = { status: "idle" }
    }
  }

  recordingFinished() {
    return when(() => this.state.status === "idle")
  }
}

function cliArgs(input: (string | string[])[]) {
  return input.flat().join(" ").split(/\s+/)
}
