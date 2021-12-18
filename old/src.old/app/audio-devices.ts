import { makeAutoObservable, observable } from "mobx"
import { PulseAudio } from "pulseaudio.js"
import { logErrorStack } from "../common/errors"
import { createSetting } from "./settings"

export type AudioDevice = {
  id: string
  name: string
  alsaString?: string
  channelCount?: number
  sampleRate?: number
  muted?: boolean
}

export type AudioDeviceSelector = Awaited<
  ReturnType<typeof createAudioDeviceSelector>
>

export async function createAudioDeviceSelector() {
  const pa = new PulseAudio()
  await pa.connect()

  const initialDevices = await requestDevices(pa)

  const serverInfo = await pa.getServerInfo()

  const defaultDevice =
    initialDevices.find((d) => d.id === serverInfo.defaultSource) ??
    initialDevices[0]

  const audioDeviceSetting = createSetting("audioDeviceId", defaultDevice?.id)

  const instance = makeAutoObservable(
    {
      devices: initialDevices,

      get selectedDevice(): AudioDevice | undefined {
        return this.devices.find((d) => d.id === audioDeviceSetting.value)
      },

      select(id: NonNullable<AudioDevice["id"]>) {
        audioDeviceSetting.value = id
      },
    },
    { devices: observable.ref },
  )

  const handleSourceChange = () => {
    requestDevices(pa).then((devices) => {
      instance.devices = devices
    }, logErrorStack)
  }

  pa.on("event.source.new", handleSourceChange)
    .on("event.source.remove", handleSourceChange)
    .on("event.source.change", handleSourceChange)

  return instance
}

async function requestDevices(pa: PulseAudio): Promise<AudioDevice[]> {
  try {
    const sources = await pa.getAllSources()
    return sources.map((source: any, index) => {
      const alsaCard = tryParseString(source.properties?.alsa?.card)
      const alsaDevice = tryParseString(source.properties?.alsa?.device) ?? "0"
      const alsaString = alsaCard ? `hw:${alsaCard},${alsaDevice}` : undefined

      return {
        id: tryParseString(source.name) || `device-${index}`,
        name:
          tryParseString(source.properties?.alsa?.card_name) ||
          "Unknown Device",
        alsaString,
        channelCount: tryParseNumber(source.sampleSpec?.channels),
        sampleRate: tryParseNumber(source.sampleSpec?.rate),
        muted: source.mute,
      }
    })
  } catch (error) {
    logErrorStack(error)
    return []
  }
}

function tryParseString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function tryParseNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined
}
