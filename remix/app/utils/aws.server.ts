import { AwsClient } from 'aws4fetch'

const aws = new AwsClient({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  region: process.env.AWS_DEFAULT_REGION
})

export const submitJob = async (id: string) => {
  await aws.fetch(
    `https://batch.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/v1/submitjob`,
    {
      method: 'POST',
      body: JSON.stringify({
        jobName: `power-plant-${id}`,
        jobDefinition: process.env.JOB_DEFINITION,
        jobQueue: process.env.JOB_QUEUE,
        timeout: {
          attemptDurationSeconds: 3600 * 0.45 // 45m
        },
        containerOverrides: {
          command: ['ts-node', '/script.ts', id]
        }
      })
    }
  )
}

export const getMediaMeta = async (bucket: string, key: string) => {
  const res = await aws.fetch(
    `https://s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${bucket}/${key}`,
    {
      method: 'HEAD'
    }
  )

  return {
    type: res.headers.get('content-type'),
    size: bytesToSize(Number(res.headers.get('content-length')))
  }
}

const bytesToSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))))
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i]
}
