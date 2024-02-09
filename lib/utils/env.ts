import { lazyGet } from './object.js'

export enum PLATFORM {
  Mac,
  Linux,
}

export enum ARCH {
  ARM64,
  X64,
}

export const platform = lazyGet(() => {
  const platform = process.platform
  switch (platform) {
    case 'darwin':
      return PLATFORM.Mac
    case 'linux':
      return PLATFORM.Linux
  }
  throw new Error(`platform ${platform} not supported.`)
})

export const arch = lazyGet(() => {
  const arch = process.arch
  switch (arch) {
    case 'arm64':
      return ARCH.ARM64
    case 'x64':
      return ARCH.X64
  }
  throw new Error(`arch ${arch} not supported.`)
})
