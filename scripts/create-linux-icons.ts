import { mkdir } from "node:fs/promises"
import { relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const projectRoot = resolve(fileURLToPath(import.meta.url), "../..")
const iconFile = resolve(projectRoot, "public/icon.png")
const iconSizes = [16, 24, 32, 48, 64, 128, 256, 512]
const outputFolder = resolve(projectRoot, "assets/icons/linux")

await mkdir(outputFolder, { recursive: true })

for (const size of iconSizes) {
  const outputFile = resolve(outputFolder, `${size}x${size}.png`)
  await sharp(iconFile).resize(size, size).toFile(outputFile)
  console.info(`Created `, relative(projectRoot, outputFile))
}
