import { makeAutoObservable, observable } from "mobx"
import { PulseAudio } from "pulseaudio.js"
import { logErrorStack } from "../common/errors"
import { createSetting } from "./settings"

export type AudioDevice = {
  id?: string
  name: string
}

export type AudioDeviceSelector = Awaited<
  ReturnType<typeof createAudioDeviceListener>
>

export const audioDeviceSetting = createSetting("audioDeviceId", "default")

export async function createAudioDeviceListener() {
  const pa = new PulseAudio()
  await pa.connect()

  const instance = makeAutoObservable(
    { devices: [] as AudioDevice[] },
    { devices: observable.ref },
  )

  async function updateDevices() {
    const sources = await pa.getAllSources()

    instance.devices = sources.map((source) => ({
      // we'll consider a source disabled if id is undefined
      id:
        // state 2 means suspended
        typeof source.name === "string" && source.state !== 2
          ? source.name
          : undefined,
      name: String(source.description || "Unknown Device"),
    }))

    if (audioDeviceSetting.value !== "default") return

    const firstEnabledDevice = instance.devices.find(
      (device) => device.id !== undefined,
    )
    if (!firstEnabledDevice?.id) return

    audioDeviceSetting.set(firstEnabledDevice.id)
  }

  const handleSourceChange = () => updateDevices().catch(logErrorStack)
  pa.on("event.source.new", handleSourceChange)
    .on("event.source.remove", handleSourceChange)
    .on("event.source.change", handleSourceChange)

  await updateDevices()

  return instance
}
