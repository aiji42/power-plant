import * as path from 'path'
import { spawn } from 'child_process'
import { download, listFiles, upload } from './libraries'
import { URL } from 'url'

const compression = async (target: string): Promise<string> => {
  const newFile = `${path.dirname(target)}/_${path.basename(
    target,
    path.extname(target)
  )}.mp4`
  return new Promise((resolve, reject) => {
    console.log(
      `> ffmpeg -y -i ${target} -s 856:480 -b:v 1.2m -r 30 -vcodec libx264 ${newFile}`
    )

    const ffmpeg = spawn(
      'ffmpeg',
      [`-y -i ${target} -s 856:480 -b:v 1.2m -r 30 -vcodec libx264 ${newFile}`],
      {
        shell: true
      }
    )
    let counter = 0
    ffmpeg.stdout.on('data', (data) => {
      if (!data.toString().includes('frame=')) {
        console.log(data.toString())
        return
      }
      if (counter++ < 30) return
      console.log(data.toString())
      counter = 0
    })

    let stderr = ''
    ffmpeg.stderr.on('data', (data) => {
      if (stderr === data.toString()) return
      stderr = data.toString()
      console.error(stderr)
    })

    ffmpeg.on('close', (code) => {
      console.log(`ffmpeg exited with code ${code}`)
      if (code === 0) resolve(newFile)
      else reject(null)
    })
  })
}

const main = async () => {
  const targetUrl = process.argv[2]

  if (!targetUrl) throw new Error('pass target file url')

  try {
    await download(targetUrl, '/downloads')
    const [file] = listFiles('/downloads')
    const src = await compression(file)
    const { pathname } = new URL(targetUrl)

    const url = await upload(
      src,
      process.env.BUCKET ?? '',
      `${pathname.replace(/^\/|\.[a-z0-9]+$/g, '')}${path.extname(src)}`
    )
    console.log('Compression complete ', url)
  } catch (e) {
    if (e instanceof Error) console.error(e.message)
    throw e
  }
}

main()
