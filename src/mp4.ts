import { $ } from 'bun'
import os from 'os'
import { getMediaInfo } from '../lib/mediaInfo'
import {
  logger,
  matchFiles,
  stem,
  transformFiles,
} from '../lib/utils/file-tools'

const exts = [
  'mp4',
  'mov',
  'qt',
  'avi',
  'ts',
  'm4v',
  'webm',
  'wmv',
  'mts' /* 'gif' */,
]

export async function run(args: {
  files: string[] | undefined
  hevc: boolean
  avif: boolean
  gpu: boolean
  remove: boolean
  copy: boolean
  compare: boolean
  detect: boolean
  preset: string
}) {
  const files = await matchFiles(
    args.files,
    exts,
    (p) => !p.endsWith('.min.mp4')
  )

  if (args.detect) {
    for await (const p of files) {
      const { video } = await getMediaInfo(p)
      if (Number.parseInt(video._bitRate!) > 55 * 1000 * 1000) {
        logger.error('%s (%s) %s', video.bitRate, video.type, p)
      } else if (Number.parseInt(video._bitRate!) > 30 * 1000 * 1000) {
        logger.warn('%s (%s) %s', video.bitRate, video.type, p)
      } else if (Number.parseInt(video._bitRate!) > 15 * 1000 * 1000) {
        logger.info('%s (%s) %s', video.bitRate, video.type, p)
      } else {
        // logger.log('%s (%s) %s', video.bitRate, video.type, p)
      }
    }

    return
  }

  const ffmpegArgs = [
    '-copyts',
    '-movflags',
    'use_metadata_tags',
    '-map_metadata',
    '0',
    // '-x264-params',
    // 'opencl=true',
    args.hevc ? ['-tag:v', 'hvc1'] : [],
    // important ? [] : ['-fpsmax', '60'],
    args.copy
      ? ['-c:v', 'copy', '-c:a', 'copy']
      : args.gpu
        ? args.hevc
          ? ['-c:v', 'hevc_videotoolbox']
          : args.avif
            ? ['-c:v', 'libaom-av1']
            : ['-c:v', 'h264_videotoolbox']
        : args.hevc
          ? ['-c:v', 'libx265']
          : args.avif
            ? ['-c:v', 'libaom-av1']
            : ['-c:v', 'libx264'],
    '-crf',
    args.hevc ? '24' /* 28 */ : args.avif ? '32' : '23', // less is better
    '-fps_mode',
    'passthrough',
  ].flat()

  if (args.avif) {
    ffmpegArgs.push('-cpu-used', '6', '-row-mt', '1')
  }

  if (args.preset) {
    ffmpegArgs.push('-preset', args.preset)
  }

  console.log(ffmpegArgs)

  await transformFiles(
    files,
    (p: string) => {
      const name = stem(p)
      if (args.hevc) {
        if (p.endsWith('.gif')) {
          return name + '-gif_hevc.min.mp4'
        }
        return name + '-hevc.min.mp4'
      } else if (args.avif) {
        if (p.endsWith('.gif')) {
          return name + '-gif_avif.min.mp4'
        }
        return name + '-avif.min.mp4'
      } else if (p.endsWith('.gif')) {
        return name + '-gif.min.mp4'
      } else {
        return name + '.min.mp4'
      }
    },
    async (oldPath, newPath) => {
      const { video } = await getMediaInfo(oldPath)
      if (video.hdr && !args.hevc) {
        console.error('HDR video but not use hevc, refused')
        process.exit(1)
      }
      let cliArgs = ffmpegArgs
      if (oldPath.endsWith('.gif')) {
        //https://unix.stackexchange.com/questions/40638/how-to-do-i-convert-an-animated-gif-to-an-mp4-or-mv4-on-the-command-line
        cliArgs = [
          '-pix_fmt',
          'yuv420p',
          '-vf',
          `scale=trunc(iw/2)*2:trunc(ih/2)*2`,
          ...ffmpegArgs,
        ]
      }

      await $`ffmpeg -noautorotate -hwaccel videotoolbox -i ${oldPath} ${cliArgs} ${newPath}`.env(
        {
          AV_LOG_FORCE_COLOR: '3',
        }
      )
    },
    { ...args, concurrency: 1 },
    async (oldPath, newPath) => {
      if (oldPath.endsWith('.gif')) return
      const { video: oVideo, audio: OAudio } = await getMediaInfo(oldPath)
      const { video, audio } = await getMediaInfo(newPath)

      console.log('Video:')
      Object.keys(video).forEach((name) => {
        if (name.startsWith('_')) return
        console.log(
          '    %s:%s   %s -> %s ',
          name.padEnd(15),
          video[name] === oVideo[name] ? '✅' : '🔔',
          oVideo[name]!.padEnd(15),
          video[name]
        )
      })

      console.log('Audio:')
      Object.keys(audio).forEach((name) => {
        if (name.startsWith('_')) return
        console.log(
          '    %s:%s  %s -> %s',
          name.padEnd(15),
          OAudio[name] === audio[name] ? '✅' : '🔔',
          OAudio[name]!.padEnd(15),
          audio[name]
        )
      })

      if (args.compare) {
        // https://juejin.cn/post/7186136643928555577
        await $`ffmpeg -hwaccel videotoolbox -i ${oldPath} -an -i ${newPath} -an -lavfi libvmaf="n_threads=${
          os.cpus().length - 1
        }:n_subsample=${10}" -f null -`
      }
    }
  )
}
