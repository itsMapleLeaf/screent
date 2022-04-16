const { mkdir } = require("node:fs/promises")
const { relative, resolve } = require("node:path")
const sharp = require("sharp")

/** @type {import('electron-builder').Configuration} */
const config = {
  appId: "dev.mapleleaf.screent",
  files: ["{build,public,assets}/**/*", "!assets/icons/linux/**/*"],
  asar: false,
  directories: {
    output: "release",
  },
  linux: {
    target: ["AppImage", "flatpak"],
    icon: "assets/icons/linux",
    category: "Utility",
    publish: ["github"],
  },
  flatpak: {
    modules: [
      {
        name: "libogg",
        sources: [
          {
            type: "git",
            url: "https://gitlab.xiph.org/xiph/ogg.git",
            tag: "v1.3.5",
          },
        ],
        cleanup: ["/include", "/lib/*.a", "/lib/*.la", "/lib/pkgconfig"],
      },
      {
        name: "libvorbis",
        sources: [
          {
            type: "git",
            url: "https://gitlab.xiph.org/xiph/vorbis.git",
            tag: "v1.3.7",
          },
        ],
        cleanup: ["/include", "/lib/*.a", "/lib/*.la", "/lib/pkgconfig"],
      },
      // from https://github.com/flathub/shared-modules
      // these are needed for slop
      {
        "name": "glu",
        "config-opts": ["--disable-static"],
        "sources": [
          {
            type: "archive",
            url: "https://mesa.freedesktop.org/archive/glu/glu-9.0.2.tar.xz",
            sha256:
              "6e7280ff585c6a1d9dfcdf2fca489251634b3377bfc33c29e4002466a38d02d4",
          },
        ],
        "cleanup": ["/include", "/lib/*.a", "/lib/*.la", "/lib/pkgconfig"],
      },
      {
        "name": "glew",
        "no-autogen": true,
        "make-args": [
          "GLEW_PREFIX=${FLATPAK_DEST}",
          "GLEW_DEST=${FLATPAK_DEST}",
          "LIBDIR=${FLATPAK_DEST}/lib",
          "CFLAGS.EXTRA:=${CFLAGS} -fPIC",
          "LDFLAGS.EXTRA=${LDFLAGS}",
        ],
        "make-install-args": [
          "GLEW_PREFIX=${FLATPAK_DEST}",
          "GLEW_DEST=${FLATPAK_DEST}",
          "LIBDIR=${FLATPAK_DEST}/lib",
          "CFLAGS.EXTRA:=${CFLAGS} -fPIC",
          "LDFLAGS.EXTRA=${LDFLAGS}",
        ],
        "sources": [
          {
            type: "archive",
            url: "https://downloads.sourceforge.net/project/glew/glew/2.2.0/glew-2.2.0.tgz",
            sha256:
              "d4fc82893cfb00109578d0a1a2337fb8ca335b3ceccf97b97e5cc7f08e4353e1",
          },
        ],
        "cleanup": ["/include", "/lib/pkgconfig", "/lib/*.a"],
      },
      {
        "name": "glm",
        "buildsystem": "simple",
        "build-commands": [
          `cp -r ./glm /app/include`,
          `cp -r ./cmake /app/lib`,
        ],
        "sources": [
          {
            type: "archive",
            url: "https://github.com/g-truc/glm/archive/refs/tags/0.9.9.8.zip",
            sha256:
              "4605259c22feadf35388c027f07b345ad3aa3b12631a5a316347f7566c6f1839",
          },
        ],
      },
      {
        name: "slop",
        buildsystem: "cmake",
        sources: [
          {
            type: "git",
            url: "https://github.com/naelstrof/slop.git",
          },
        ],
        cleanup: ["/include", "/lib/*.a", "/lib/*.la", "/lib/pkgconfig"],
      },
    ],
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
