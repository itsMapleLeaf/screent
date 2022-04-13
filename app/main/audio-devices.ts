import { PulseAudio } from "pulseaudio.js"
import { z } from "zod"
import { logErrorStack } from "../common/errors"
import { StoredValue } from "./stored-value"

export type AudioDevice = {
  id: string
  name: string
  alsaString?: string
  channelCount?: number
  sampleRate?: number
  muted?: boolean
}

const storedAudioDeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const storedAudioDevice = new StoredValue(
  "audioDevice",
  storedAudioDeviceSchema,
)

export class AudioDeviceSelector {
  private constructor(
    public devices: AudioDevice[],
    private selectedDeviceId: string | undefined,
  ) {}

  static async create() {
    const pa = new PulseAudio()
    await pa.connect()

    const initialDevices = await requestDevices(pa)
    const serverInfo = await pa.getServerInfo()
    const lastDevice = storedAudioDevice.get()

    const defaultDevice =
      // this formats better than a single .find :)
      initialDevices.find((device) => device.id === lastDevice?.id) ??
      initialDevices.find((device) => device.name === lastDevice?.name) ??
      initialDevices.find((device) => device.id === serverInfo.defaultSource) ??
      initialDevices[0]

    const instance = new AudioDeviceSelector(initialDevices, defaultDevice?.id)

    const handleSourceChange = () => {
      requestDevices(pa)
        .then((devices) => {
          instance.devices = devices
        })
        .catch(logErrorStack)
    }

    pa.on("event.source.new", handleSourceChange)
      .on("event.source.remove", handleSourceChange)
      .on("event.source.change", handleSourceChange)

    return instance
  }

  get selectedDevice(): AudioDevice | undefined {
    return this.devices.find((device) => device.id === this.selectedDeviceId)
  }

  select(id: NonNullable<AudioDevice["id"]>) {
    this.selectedDeviceId = id
    if (this.selectedDevice) {
      storedAudioDevice.set({ id, name: this.selectedDevice?.name })
    }
  }
}

async function requestDevices(pa: PulseAudio): Promise<AudioDevice[]> {
  try {
    const sources = await pa.getAllSources()
    return sources.map((source: any, index) => {
      const alsaCard = maybeString(source.properties?.alsa?.card)
      const alsaDevice = maybeString(source.properties?.alsa?.device) ?? "0"
      const alsaString = alsaCard ? `hw:${alsaCard},${alsaDevice}` : undefined

      return {
        id: maybeString(source.name) || `device-${index}`,
        name:
          maybeString(source.properties?.alsa?.card_name) || "Unknown Device",
        alsaString,
        channelCount: maybeNumber(source.sampleSpec?.channels),
        sampleRate: maybeNumber(source.sampleSpec?.rate),
        muted: source.mute,
      }
    })
  } catch (error) {
    logErrorStack(error)
    return []
  }
}

function maybeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function maybeNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined
}
