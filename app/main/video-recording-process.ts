import { ExecaChildProcess } from "execa"
import { rm } from "node:fs/promises"
import { Rect } from "../common/Rect"
import { AudioDevice } from "./audio-devices"
import { runFFmpeg } from "./ffmpeg"

export class VideoRecordingProcess {
  private promise: Promise<unknown>
  private videoProcess: ExecaChildProcess
  private audioProcess: ExecaChildProcess | undefined

  constructor(
    region: Rect,
    outputPath: string,
    audioDevice: AudioDevice | undefined,
  ) {
    const videoOutputPath = outputPath + ".mp4"
    const audioOutputPath = outputPath + ".ogg"

    this.videoProcess = runFFmpeg(
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
    )

    this.audioProcess = audioDevice
      ? runFFmpeg(
          // audio input
          `-f pulse`,
          `-i ${audioDevice.id}`,

          // audio output options
          `-codec:a libvorbis`,
          `-ac ${audioDevice.channelCount ?? "2"}`,
          `-ar ${audioDevice.sampleRate ?? "48000"}`,

          audioOutputPath,
        )
      : undefined

    this.promise = Promise.all([this.videoProcess, this.audioProcess])
      .then(() => {
        return runFFmpeg(
          `-i ` + videoOutputPath,
          `-i ` + audioOutputPath,
          `-c copy`,
          outputPath,
        )
      })
      .finally(() => {
        if (!this.videoProcess.killed) {
          this.videoProcess.kill()
        }
        if (this.audioProcess && !this.audioProcess.killed) {
          this.audioProcess.kill()
        }
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
    this.audioProcess?.kill("SIGINT")
  }
}
