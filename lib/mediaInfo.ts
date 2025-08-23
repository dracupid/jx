/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { $ } from 'bun'

const CODEC_MAP: Record<string, string> = {
  AVC: 'h264',
  'MPEG-4 Visual': 'h263',
}

function toCodec(val: string) {
  return CODEC_MAP[val] || val
}

export function readableBitRateKbps(num: string) {
  return `${(Number.parseInt(num) / 1000).toFixed(0)} kbps`
}

export function readableBitRateMbps(num: string) {
  return `${(Number.parseInt(num) / 1000 / 1000).toFixed(2)} Mbps`
}

function toKB(num: string) {
  return `${(Number.parseInt(num) / 1000).toFixed(2)} KB`
}

function toMB(num: string) {
  return `${(Number.parseInt(num) / 1000 / 1000).toFixed(2)} MB`
}
export async function getMediaInfo(file: string) {
  const inputMediaInfo = await $`mediainfo ${file} --Output=JSON`.quiet()
  const inputInfo: any = JSON.parse(inputMediaInfo.text())
  // console.log(inputInfo.media.track)
  let video: Record<string, string> = {}
  let audio: Record<string, string> = {}
  for (const t of inputInfo.media.track) {
    if (t['@type'] === 'Video') {
      video = {
        type: `${toCodec(t.Format as string)}/${t.CodecID}`,
        bitRate: readableBitRateMbps(t.BitRate as string),
        frameRateMode: t.FrameRate_Mode || '',
        frameRate: t.FrameRate || '',
        colorMode: `${t.ColorSpace}/${t.ChromaSubsampling}/${t.BitDepth}`,
        size: `${t.Width}x${t.Height}`,
        hdr: t.HDR_Format || '',
        transferChars:
          t.transfer_characteristics_Original ||
          t.transfer_characteristics ||
          '',
        colorPrims: t.colour_primaries_Original || t.colour_primaries || '',
        StreamSize: toMB(t.StreamSize as string),
        _bitRate: (t.BitRate || '') + '',
      }
    } else if (t['@type'] === 'Audio') {
      audio = {
        type: `${toCodec(t.Format as string)}/${t.CodecID}`,
        bitRate: readableBitRateKbps(
          (t.BitRate || t.BitRate_Maximum) as string
        ),
        bitRateMode: t.BitRate_Mode || '',
        frameRate: t.FrameRate || '',
        StreamSize: toKB((t.StreamSize || t.Source_StreamSize) as string),
        _bitRate: (t.BitRate || t.BitRate_Maximum || '') + '',
      }
    }
  }
  return { audio, video }
}
