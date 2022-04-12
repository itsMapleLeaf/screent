import execa, { ExecaChildProcess, Options as ExecaOptions } from "execa"
import { rm } from "node:fs/promises"
import { isDevelopment } from "../common/constants"
import { isTruthy } from "../common/is-truthy"
import { Rect } from "../common/Rect"
import { AudioDevice } from "./audio-devices"

export class VideoRecordingProcess {
  private promise: Promise<unknown>
  private videoProcess: ExecaChildProcess
  private audioProcess: ExecaChildProcess | undefined

  constructor(
    region: Rect,
    outputPath: string,
    audioDevice: AudioDevice | undefined,
  ) {
    const processOptions: ExecaOptions = {
      stdout: isDevelopment ? "inherit" : "ignore",
      stderr: isDevelopment ? "inherit" : "ignore",
    }

    const videoOutputPath = outputPath + ".mp4"
    const audioOutputPath = outputPath + ".ogg"

    this.videoProcess = execa(
      "ffmpeg",
      toCommandArgs(
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

        videoOutputPath,
      ),
      processOptions,
    )

    this.audioProcess = audioDevice
      ? execa(
          "ffmpeg",
          toCommandArgs(
            // audio input
            `-f pulse`,
            `-i ${audioDevice.id}`,

            // audio output options
            `-codec:a libvorbis`,
            `-ac ${audioDevice.channelCount ?? "2"}`,
            `-ar ${audioDevice.sampleRate ?? "48000"}`,

            audioOutputPath,
          ),
          processOptions,
        )
      : undefined

    this.promise = Promise.all([this.videoProcess, this.audioProcess])
      .then(() => {
        return execa(
          "ffmpeg",
          toCommandArgs(
            `-i ` + videoOutputPath,
            `-i ` + audioOutputPath,
            `-c copy`,
            outputPath,
          ),
          processOptions,
        )
      })
      .finally(() => {
        return Promise.all([
          rm(videoOutputPath, { force: true }),
          rm(audioOutputPath, { force: true }),
        ])
      })
  }

  async whenDone() {
    await this.promise
  }

  stop() {
    this.videoProcess.stdin?.write("q")
    this.audioProcess?.stdin?.write("q")
  }
}

type NestedArray<T> = Array<T | NestedArray<T>>

const toCommandArgs = (...strings: NestedArray<string>) =>
  (strings.flat() as readonly string[])
    .filter(isTruthy)
    .flatMap((flag) => flag.split(/\s+/))
