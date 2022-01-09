export type MediaMetaData = {
  duration: number | undefined
  frameRate: number | undefined
  size: string
  bitRate: string | undefined
  type: string
  resolution: string | undefined
  codec: string | undefined
}

export const getMediaMeta = async (url: string): Promise<MediaMetaData> => {
  const res = await fetch(url, {
    method: 'HEAD'
  })

  const meteCodec = res.headers.get('x-amz-meta-codec')
  const codec = meteCodec ?? undefined

  const meteBitRate = res.headers.get('x-amz-meta-bitrate')
  const bitRate = meteBitRate
    ? (Number(meteBitRate) / 1024 ** 2).toFixed(2)
    : undefined

  const metaDuration = res.headers.get('x-amz-meta-duration')
  const duration = metaDuration
    ? Math.round(Number(metaDuration) / 6000)
    : undefined

  const metaFrameRate = res.headers.get('x-amz-meta-framerate')
  const frameRate = metaFrameRate
    ? Math.round(Number(metaFrameRate))
    : undefined

  const metaWidth = res.headers.get('x-amz-meta-width')
  const metaHeight = res.headers.get('x-amz-meta-height')
  const resolution =
    metaWidth && metaHeight ? `${metaWidth}x${metaHeight}` : undefined

  return {
    type: res.headers.get('content-type') ?? '',
    size: bytesToSize(Number(res.headers.get('content-length'))),
    bitRate,
    duration,
    frameRate,
    resolution,
    codec
  }
}

const bytesToSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))))
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i]
}
