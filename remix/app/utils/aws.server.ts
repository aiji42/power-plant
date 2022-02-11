import { AwsClient } from 'aws4fetch'

const aws = new AwsClient({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  region: process.env.AWS_DEFAULT_REGION
})

const BATCH_ENDPOINT = `https://batch.${process.env.AWS_DEFAULT_REGION}.amazonaws.com`

export const submitDownloadJob = async (id: string) => {
  await aws.fetch(`${BATCH_ENDPOINT}/v1/submitjob`, {
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
  })
}

export const listDownloadJobs = async (id: string): Promise<JobSummary[]> => {
  return await jobList(
    `power-plant-download-${id}`,
    process.env.JOB_QUEUE ?? '',
    'Download'
  )
}

export const submitCompressionJob = async (id: string, url: string) => {
  await aws.fetch(`${BATCH_ENDPOINT}/v1/submitjob`, {
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
  })
}

export const listCompressionJobs = async (
  id: string
): Promise<JobSummary[]> => {
  return await jobList(
    `power-plant-compression-${id}`,
    process.env.JOB_QUEUE_FOR_HIGH ?? '',
    'Compression'
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

export const getJsonObject = async (bucket: string, key: string) => {
  const res = await aws.fetch(
    `https://s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${bucket}/${key}`
  )
  return await res.json()
}

export type JobSummaryBase = {
  jobArn: string
  jobId: string
  jobName: string
  createdAt?: number | null
  status:
    | 'SUBMITTED'
    | 'PENDING'
    | 'RUNNABLE'
    | 'STARTING'
    | 'RUNNING'
    | 'SUCCEEDED'
    | 'FAILED'
  stoppedAt?: number | null
  jobDefinition: string
}

export type JobSummary = JobSummaryBase & {
  type: string
  duration: number | null
}

const jobList = async (
  jobName: string,
  jobQueue: string,
  jobType: string
): Promise<JobSummary[]> => {
  const res = await aws.fetch(`${BATCH_ENDPOINT}/v1/listjobs`, {
    method: 'POST',
    body: JSON.stringify({
      filters: [
        {
          name: 'JOB_NAME',
          values: [jobName]
        }
      ],
      jobQueue,
      maxResults: 100
    })
  })
  const jobs = (
    (await res.json()) as {
      jobSummaryList: JobSummaryBase[]
    }
  ).jobSummaryList
  return jobs.map((job) => ({
    ...job,
    type: jobType,
    duration:
      job.stoppedAt && job.createdAt ? job.stoppedAt - job.createdAt : null
  }))
}
