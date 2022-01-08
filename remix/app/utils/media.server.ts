export const getMediaMeta = async (url: string) => {
  const res = await fetch(url, {
    method: 'HEAD'
  })

  return {
    type: res.headers.get('content-type') ?? '',
    size: bytesToSize(Number(res.headers.get('content-length')))
  }
}

const bytesToSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))))
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i]
}
