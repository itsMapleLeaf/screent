import execa, { Options as ExecaOptions } from "execa"
import ffmpegPath from "ffmpeg-static"
import { isDevelopment } from "../common/constants"
import { isTruthy } from "../common/is-truthy"

const processOptions: ExecaOptions = {
  stdout: isDevelopment ? "inherit" : "ignore",
  stderr: isDevelopment ? "inherit" : "ignore",
}

export function runFFmpeg(...inputs: NestedArray<string>) {
  return execa(ffmpegPath, toCommandArgs(inputs), processOptions)
}

type NestedArray<T> = Array<T | NestedArray<T>>

const toCommandArgs = (...inputs: NestedArray<string>) =>
  (inputs.flat() as readonly string[])
    .filter(isTruthy)
    .flatMap((flag) => flag.split(/\s+/))
