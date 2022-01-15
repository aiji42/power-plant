import { AwsClient } from 'aws4fetch'

const aws = new AwsClient({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  region: process.env.AWS_DEFAULT_REGION
})

export const submitDownloadJob = async (id: string) => {
  await aws.fetch(
    `https://batch.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/v1/submitjob`,
    {
      method: 'POST',
      body: JSON.stringify({
        jobName: `power-plant-download-${id}`,
        jobDefinition: process.env.JOB_DEFINITION_FOR_DOWNLOAD,
        jobQueue: process.env.JOB_QUEUE,
        timeout: {
          attemptDurationSeconds: 3600 * 0.45 // 45m
        },
        containerOverrides: {
          command: ['ts-node', '/download.ts', id]
        }
      })
    }
  )
}

export const submitCompressionJob = async (id: string, url: string) => {
  await aws.fetch(
    `https://batch.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/v1/submitjob`,
    {
      method: 'POST',
      body: JSON.stringify({
        jobName: `power-plant-compression-${id}`,
        jobDefinition: process.env.JOB_DEFINITION_FOR_COMPRESSION,
        jobQueue: process.env.JOB_QUEUE_FOR_HIGH,
        timeout: {
          attemptDurationSeconds: 3600
        },
        containerOverrides: {
          command: ['ts-node', '/compression.ts', id, url]
        }
      })
    }
  )
}

export const getBucketAndKeyFromURL = (url: string): [string, string] => {
  const [, bucket, key] = url.match(/https:\/\/(.+)\.s3.+?\/(.+)/) ?? []
  return [bucket, key]
}

export const deleteMedia = async (bucket: string, key: string) => {
  await aws.fetch(
    `https://s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${bucket}/${key}`,
    {
      method: 'DELETE'
    }
  )
}
