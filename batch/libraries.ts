import { spawn, exec } from 'child_process'
import fs from 'fs'
import ffprobe from 'ffprobe'

export const download = async (target: string, dir: string) =>
  new Promise((resolve, reject) => {
    console.log(
      `> aria2c -d ${dir} --seed-time=0 --max-overall-upload-limit=1K --bt-stop-timeout=300 --lowest-speed-limit=500K ${target}`
    )
    const aria2c = spawn(
      'aria2c',
      [
        `-d ${dir} --seed-time=0 --max-overall-upload-limit=1K --bt-stop-timeout=300 --lowest-speed-limit=500K ${target}`
      ],
      {
        shell: true,
        timeout: 1000 * 60 * 30
      }
    )
    aria2c.stdout.on('data', (data) => {
      if (!data.toString().includes('Summary')) return
      console.log(data.toString())
    })

    let stderr = ''
    aria2c.stderr.on('data', (data) => {
      if (stderr === data.toString()) return
      stderr = data.toString()
      console.error(stderr)
    })

    aria2c.on('close', (code) => {
      console.log(`aria2 exited with code ${code}`)
      if (code === 0) resolve(true)
      else reject(false)
    })
  })

export const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    return dirent.isFile()
      ? [`${dir}/${dirent.name}`]
      : listFiles(`${dir}/${dirent.name}`)
  })

export const upload = async (
  src: string,
  bucket: string,
  key: string
): Promise<string> => {
  const meta = await scan(src)
  return new Promise<string>((resolve, reject) => {
    console.log(
      `> aws s3 mv ${src} s3://${bucket}/${key} --acl public-read --metadata ${formatForMeta(
        meta
      )}`
    )

    const aws = spawn(
      'aws',
      [
        `s3 mv ${src} s3://${bucket}/${key} --acl public-read --metadata "${formatForMeta(
          meta
        )}"`
      ],
      { shell: true }
    )

    let counter = 0
    aws.stdout.on('data', (data) => {
      if (data.toString().includes('move:')) console.log(data.toString())
      if (counter++ < 1000) return
      console.log(data.toString())
      counter = 0
    })

    let stderr = ''
    aws.stderr.on('data', (data) => {
      if (stderr === data.toString()) return
      stderr = data.toString()
      console.error(stderr)
    })

    aws.on('close', (code) => {
      console.log(`aws s3 exited with code ${code}`)
      if (code === 0) resolve(makeS3Url(bucket, key))
      else reject(null)
    })
  })
}

const scan = async (
  path: string
): Promise<Record<string, number | string | undefined>> => {
  try {
    const {
      streams: [res]
    } = await ffprobe(path, { path: '/usr/bin/ffprobe' })

    const [n1, n2] = res.avg_frame_rate.split('/')
    const frameRate = Number(n1) / Number(n2)

    return {
      codec: res.codec_name,
      width: res.width,
      height: res.height,
      frameRate,
      duration: res.duration,
      bitRate: res.bit_rate
    }
  } catch (e) {
    if (e instanceof Error) console.error(e.message)
    else console.error(`Unexpected error on scanning media: ${path}`)
    return {}
  }
}

const formatForMeta = (obj: Record<string, any>): string => {
  return Object.entries(obj)
    .reduce<string[]>(
      (res, [k, v]) =>
        typeof v === 'string' || typeof v === 'number'
          ? [...res, `${k}=${v}`]
          : res,
      []
    )
    .join(',')
}

export const makeS3Url = (bucket: string, key: string) =>
  `https://${bucket}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${key}`

export const fileListOnS3 = (
  bucket: string,
  prefix: string,
  code: string
): Promise<string[]> => {
  console.log(`aws s3 ls s3://${bucket}/${prefix}/${code}/ | awk '{print $4}'`)
  return new Promise((resolve, reject) => {
    exec(
      `aws s3 ls s3://${bucket}/${prefix}/${code}/ | awk '{print $4}'`,
      (err, stdout, stderr) => {
        if (err) {
          console.error(err)
          reject(err)
        }
        if (stderr) {
          console.error(stderr)
          reject(stderr)
        }
        console.log(stdout)
        resolve(stdout.split('\n').filter(Boolean))
      }
    )
  })
}
