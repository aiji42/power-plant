export type MediaMetaData = {
  duration: string | undefined
  frameRate: string | undefined
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
  const bitRate = meteBitRate ? toSize(Number(meteBitRate), 'bps') : undefined

  const metaDuration = res.headers.get('x-amz-meta-duration')
  const duration = metaDuration
    ? `${Math.round(Number(metaDuration) / 60)}min`
    : undefined

  const metaFrameRate = res.headers.get('x-amz-meta-framerate')
  const frameRate = metaFrameRate
    ? `${Math.round(Number(metaFrameRate))}fps`
    : undefined

  const metaWidth = res.headers.get('x-amz-meta-width')
  const metaHeight = res.headers.get('x-amz-meta-height')
  const resolution =
    metaWidth && metaHeight ? `${metaWidth}x${metaHeight}` : undefined

  return {
    type: res.headers.get('content-type') ?? '',
    size: toSize(Number(res.headers.get('content-length')), 'B'),
    bitRate,
    duration,
    frameRate,
    resolution,
    codec
  }
}

const toSize = (bytes: number, unit: string) => {
  const sizes = ['', 'K', 'M', 'G', 'T']
  if (bytes == 0) return '0 Byte'
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)}${sizes[i]}${unit}`
}
