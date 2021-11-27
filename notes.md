## external dependencies

- scrot for screenshotting (?)
- slop for getting region
- ffmpeg for recording video

## app

- [ ] package for distribution
- [ ] improved logging - show important messages as notifications

## tray

- [ ] tray icon that isn't an anime girl eating a burger
- [x] show devtools
- [x] hide devtools
- [x] audio device selection
- [x] persist selected audio device

## recording mvp

- [x] start recording via hotkey
- [x] start recording via tray
- [x] run slop for a recording region
- [x] show the recording frame sized to the region
- [x] style the recording frame with a fancy border and buttons
- [x] record video
- [x] record audio
- [x] use selected audio device
- [x] finish recording via hotkey
- [x] finish recording via tray
- [x] figure out how to not record the actual frame
- [x] save to fileAudioDevice
- [ ] move recording region while recording?
- [ ] config: video path
- [ ] config: FPS
- [ ] config: quality

## screenshot mvp

- [ ] press screenshot hotkey
- [ ] run slop for a screenshot region
- [ ] take screenshot
- [ ] open in editor
- [ ] editor: crop to a region
- [ ] editor: crop to a specific display
- [ ] editor: crop to a window
- [ ] editor: other editing things maybe
- [ ] editor: save to file (closes window)
- [ ] editor: copy to clipboard (closes window)
- [ ] editor: upload and copy url (closes window)

## screenshot

- [ ] configurable screenshot path

## example pulseaudio devices

```js
;[
  {
    index: 1,
    name: "alsa_input.usb-046d_081a_A4BBA1A0-02.mono-fallback",
    description: "Webcam C260 Mono",
    sampleSpec: { format: 3, channels: 1, rate: 48000 },
    channelMap: [0],
    module: 7,
    volume: { current: [65536], base: 20724, steps: 65537 },
    mute: true,
    monitor: { index: 4294967295, name: null },
    latency: { current: 5476377146921058304n, requested: 5476377146921058304n },
    driver: "module-alsa-card.c",
    flags: 119,
    properties: {
      "alsa": {
        resolution_bits: "16",
        class: "generic",
        subclass: "generic-mix",
        name: "USB Audio",
        id: "USB Audio",
        subdevice: "0",
        subdevice_name: "subdevice #0",
        device: "0",
        card: "3",
        card_name: "USB Device 0x46d:0x81a",
        long_card_name:
          "USB Device 0x46d:0x81a at usb-0000:03:00.0-13.2, high speed",
        driver_name: "snd_usb_audio",
      },
      "device": {
        api: "alsa",
        class: "sound",
        bus_path: "pci-0000:03:00.0-usb-0:13.2:1.2",
        bus: "usb",
        vendor: { id: "046d", name: "Logitech, Inc." },
        product: { id: "081a", name: "Webcam C260" },
        serial: "046d_081a_A4BBA1A0",
        form_factor: "webcam",
        string: "hw:3",
        buffering: { buffer_size: "192000", fragment_size: "96000" },
        access_mode: "mmap+timer",
        profile: { name: "mono-fallback", description: "Mono" },
        description: "Webcam C260 Mono",
        icon_name: "camera-web-usb",
      },
      "sysfs": {
        path: "/devices/pci0000:00/0000:00:01.3/0000:03:00.0/usb1/1-13/1-13.2/1-13.2:1.2/sound/card3",
      },
      "udev": { id: "usb-046d_081a_A4BBA1A0-02" },
      "module-udev-detect": { discovered: "1" },
    },
    state: 2,
    card: 1,
    ports: [
      {
        name: "analog-input-mic",
        description: "Microphone",
        priority: 8700,
        available: 0,
      },
    ],
    activePort: "analog-input-mic",
    formats: [{ encoding: 1, properties: {} }],
  },
  {
    index: 2,
    name: "alsa_input.usb-BLUE_MICROPHONE_Blue_Snowball_797_2018_12_08_44386-00.mono-fallback",
    description: "Blue Snowball Mono",
    sampleSpec: { format: 3, channels: 1, rate: 44100 },
    channelMap: [0],
    module: 8,
    volume: { current: [72085], base: 44649, steps: 65537 },
    mute: false,
    monitor: { index: 4294967295, name: null },
    latency: { current: 5476377146921058304n, requested: 5476377146921058304n },
    driver: "module-alsa-card.c",
    flags: 119,
    properties: {
      "alsa": {
        resolution_bits: "16",
        class: "generic",
        subclass: "generic-mix",
        name: "USB Audio",
        id: "USB Audio",
        subdevice: "0",
        subdevice_name: "subdevice #0",
        device: "0",
        card: "4",
        card_name: "Blue Snowball",
        long_card_name:
          "BLUE MICROPHONE Blue Snowball at usb-0000:03:00.0-13.3, full speed",
        driver_name: "snd_usb_audio",
      },
      "device": {
        api: "alsa",
        class: "sound",
        bus_path: "pci-0000:03:00.0-usb-0:13.3:1.0",
        bus: "usb",
        vendor: { id: "0d8c", name: "C-Media Electronics, Inc." },
        product: { id: "0005", name: "Blue Snowball" },
        serial: "BLUE_MICROPHONE_Blue_Snowball_797_2018_12_08_44386",
        string: "hw:4",
        buffering: { buffer_size: "176400", fragment_size: "88200" },
        access_mode: "mmap+timer",
        profile: { name: "mono-fallback", description: "Mono" },
        description: "Blue Snowball Mono",
        icon_name: "audio-card-usb",
      },
      "sysfs": {
        path: "/devices/pci0000:00/0000:00:01.3/0000:03:00.0/usb1/1-13/1-13.3/1-13.3:1.0/sound/card4",
      },
      "udev": {
        id: "usb-BLUE_MICROPHONE_Blue_Snowball_797_2018_12_08_44386-00",
      },
      "module-udev-detect": { discovered: "1" },
    },
    state: 2,
    card: 2,
    ports: [
      {
        name: "analog-input-mic",
        description: "Microphone",
        priority: 8700,
        available: 0,
      },
    ],
    activePort: "analog-input-mic",
    formats: [{ encoding: 1, properties: {} }],
  },
  {
    index: 4,
    name: "alsa_output.usb-Generic_TX-Hifi_Type_C_Audio-00.analog-stereo.monitor",
    description: "Monitor of TX-Hifi Type_C Audio Analog Stereo",
    sampleSpec: { format: 3, channels: 2, rate: 44100 },
    channelMap: [1, 2],
    module: 29,
    volume: { current: [65536, 65536], base: 65536, steps: 65537 },
    mute: false,
    monitor: {
      index: 2,
      name: "alsa_output.usb-Generic_TX-Hifi_Type_C_Audio-00.analog-stereo",
    },
    latency: { current: 5476377146921058304n, requested: 5476377146921058304n },
    driver: "module-alsa-card.c",
    flags: 98,
    properties: {
      "device": {
        description: "Monitor of TX-Hifi Type_C Audio Analog Stereo",
        class: "monitor",
        bus_path: "pci-0000:03:00.0-usb-0:13.1:1.0",
        bus: "usb",
        vendor: { id: "0bda", name: "Realtek Semiconductor Corp." },
        product: { id: "4c07", name: "TX-Hifi Type_C Audio" },
        serial: "Generic_TX-Hifi_Type_C_Audio",
        string: "2",
        icon_name: "audio-card-usb",
      },
      "alsa": {
        card: "2",
        card_name: "TX-Hifi Type_C Audio",
        long_card_name:
          "Generic TX-Hifi Type_C Audio at usb-0000:03:00.0-13.1, high speed",
        driver_name: "snd_usb_audio",
      },
      "sysfs": {
        path: "/devices/pci0000:00/0000:00:01.3/0000:03:00.0/usb1/1-13/1-13.1/1-13.1:1.0/sound/card2",
      },
      "udev": { id: "usb-Generic_TX-Hifi_Type_C_Audio-00" },
      "module-udev-detect": { discovered: "1" },
    },
    state: 2,
    card: 5,
    ports: [],
    activePort: null,
    formats: [{ encoding: 1, properties: {} }],
  },
]
```
