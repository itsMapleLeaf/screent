import { observable } from "micro-observables"
import { PulseAudio } from "pulseaudio.js"
import { logErrorStack } from "../common/errors"

export type AudioDevice = {
  id?: string
  name: string
}

export type AudioDeviceSelector = Awaited<
  ReturnType<typeof createAudioDeviceSelector>
>

export async function createAudioDeviceSelector() {
  const pa = new PulseAudio()
  await pa.connect()

  const devices = observable<AudioDevice[]>([])
  const selectedId = observable<AudioDevice["id"]>(undefined)

  await updateDevices()

  const handleSourceChange = () => updateDevices().catch(logErrorStack)
  pa.on("event.source.new", handleSourceChange)
    .on("event.source.remove", handleSourceChange)
    .on("event.source.change", handleSourceChange)

  async function updateDevices() {
    const sources = await pa.getAllSources()

    devices.set(
      sources
        .filter((source) => source.state !== 2) // state is not suspended
        .map((source) => ({
          id: typeof source.name === "string" ? source.name : undefined,
          name: String(source.description || "Unknown Device"),
        })),
    )
  }

  function setDevice(id: AudioDevice["id"]) {
    selectedId.set(id)
  }

  return {
    devices: devices.readOnly(),
    selectedId: selectedId.readOnly(),
    setDevice,
  }
}
