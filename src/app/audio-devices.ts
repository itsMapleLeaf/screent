import { makeAutoObservable, observable } from "mobx"
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

  const instance = makeAutoObservable(
    {
      devices: [] as AudioDevice[],
      selectedDeviceId: undefined as string | undefined,

      async updateDevices() {
        const sources = await pa.getAllSources()

        this.devices = sources.map((source) => ({
          // we'll consider a source disabled if id is undefined
          id:
            // state 2 means suspended
            typeof source.name === "string" && source.state !== 2
              ? source.name
              : undefined,
          name: String(source.description || "Unknown Device"),
        }))

        if (!this.selectedDeviceId) {
          this.selectedDeviceId = this.devices.find((device) => device.id)?.id
        }
      },

      setDevice(deviceId: AudioDevice["id"]) {
        this.selectedDeviceId = deviceId
      },
    },
    {
      devices: observable.ref,
    },
  )

  const handleSourceChange = () => instance.updateDevices().catch(logErrorStack)
  pa.on("event.source.new", handleSourceChange)
    .on("event.source.remove", handleSourceChange)
    .on("event.source.change", handleSourceChange)

  await instance.updateDevices()

  return instance
}
