import { file } from 'bun'
import fs from 'fs/promises'
import path from 'node:path'
import type { ReadableStream } from 'node:stream/web'
import ProgressBar from 'progress'

function getProxy(url: string) {
  if (url.startsWith('https://')) {
    return process.env.https_proxy || process.env.HTTPS_PROXY
  } else if (url.startsWith('http://')) {
    return process.env.http_proxy || process.env.HTTP_PROXY
  }
}

// TODO: 断点续传 https://www.myfreax.com/node-js-what-is-the-actual-break-point/
export async function download(url: string, filePath: string) {
  const proxy = getProxy(url) || ''
  console.log(
    `>> Downloading ${url} to ${filePath}${proxy ? `(with proxy: ${proxy})` : ''}`
  )

  if (await file(filePath).exists()) {
    console.log('>> Already downloaded')
    return
  }

  const cacheFilePath = filePath + '_jxcache'
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const handle = await fs.open(cacheFilePath, 'a')
  let isSuccess = false

  try {
    let downloadedLength = (await handle.stat()).size
    const res = await fetch(url, {
      proxy,
      headers:
        downloadedLength > 0
          ? {
              range: `bytes=${downloadedLength}-`,
            }
          : {},
    })

    if (res.status >= 300) {
      throw new Error(`download ${url} failed: status=${res.status}`)
    }

    if (!res.body) {
      throw new Error(`download ${url} failed: empty body`)
    }

    const contentLength = Number.parseInt(
      res.headers.get('content-length') || '-1'
    )
    const totalLength = contentLength + downloadedLength

    const supportRanges = !!res.headers.get('content-range')

    if (downloadedLength > 0) {
      if (supportRanges && res.status === 206) {
        // 断点续传
        console.log(`>> Download continued ${downloadedLength}/${totalLength}`)
      } else {
        // 清空重来
        await handle.truncate()
        downloadedLength = 0
      }
    }

    const bar = new ProgressBar(
      'downloading [:bar] :percent (:rate/bps) ETA: :etas ',
      {
        complete: '=',
        incomplete: ' ',
        total: totalLength,
      }
    )
    bar.tick(downloadedLength)

    for await (const chunk of res.body as unknown as ReadableStream<Uint8Array>) {
      await handle.write(chunk)
      bar.tick(chunk.length)
    }
    isSuccess = true
  } finally {
    await handle.close()
    console.log('>> Download success')
  }

  if (isSuccess) {
    await fs.rename(cacheFilePath, filePath)
  }
}
