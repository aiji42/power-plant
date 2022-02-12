export const getBucketAndKeyFromURL = (url: string): [string, string] => {
  const [, bucket, key] = url.match(/https:\/\/(.+)\.s3.+?\/(.+)/) ?? []
  return [bucket, key]
}

export const getURLFromBucketAndKey = (
  bucket: string,
  key: string,
  region = 'ap-northeast-1'
): string => {
  return `https://s3.${region}.amazonaws.com/${bucket}/${key}`
}
