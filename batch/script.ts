import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION
})

const aria = async (target: string) =>
  new Promise((resolve, reject) => {
    console.log(`> aria2c -d /downloads --seed-time=0 ${target}`)
    const aria2c = spawn('aria2c', [`-d /downloads --seed-time=0 ${target}`], {
      shell: true
    })
    aria2c.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    aria2c.stderr.on('data', (data) => {
      console.error(data.toString())
      reject(false)
    })

    aria2c.on('close', (code) => {
      console.log(`aria2 exited with code ${code}`)
      resolve(true)
    })
  })

const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    return dirent.isFile()
      ? [`${dir}/${dirent.name}`]
      : listFiles(`${dir}/${dirent.name}`)
  })

const upload = async (files: string[], code: string, sizeMin = 500000000) =>
  Promise.all(
    files
      .filter((filePath) => fs.statSync(filePath).size > sizeMin)
      .map((filePath, index) => {
        const key = `${process.env.KEY_PREFIX}/${code}/${
          index + 1
        }${path.extname(filePath)}`
        console.log('uploading: ', filePath, ' => ', key)
        const command = new PutObjectCommand({
          Bucket: process.env.BUCKET,
          Key: key,
          Body: fs.readFileSync(filePath)
        })
        return s3.send(command)
      })
  )

const main = async () => {
  const target = process.argv[2]
  if (!target) throw new Error('pass torrent file link for args')

  await aria(target)
  const files = listFiles('/downloads')
  const code = 'TEST-123'
  await upload(files, code, 2000000)
}

main()
