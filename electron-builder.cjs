const { mkdir } = require("node:fs/promises")
const { relative, resolve } = require("node:path")
const sharp = require("sharp")

/** @type {import('electron-builder').Configuration} */
const config = {
  appId: "dev.mapleleaf.screent",
  files: ["{build,public}/**/*"],
  asar: false,
  directories: {
    output: "release",
  },
  linux: {
    target: ["AppImage", "deb", "rpm", "pacman"],
    icon: "assets/icons/linux",
    category: "Utility",
    publish: ["github"],
  },
  deb: {
    depends: ["ffmpeg", "slop"],
  },
  rpm: {
    depends: ["ffmpeg", "slop"],
  },
  pacman: {
    depends: ["ffmpeg", "slop"],
  },
  beforePack: async () => {
    const projectRoot = __dirname
    const iconFile = resolve(projectRoot, "public/icon.png")
    const iconSizes = [16, 24, 32, 48, 64, 128, 256, 512]
    const outputFolder = resolve(projectRoot, "assets/icons/linux")

    await mkdir(outputFolder, { recursive: true })

    for (const size of iconSizes) {
      const outputFile = resolve(outputFolder, `${size}x${size}.png`)
      await sharp(iconFile).resize(size, size).toFile(outputFile)
      console.info(`Created`, relative(projectRoot, outputFile))
    }
  },
}

module.exports = config
