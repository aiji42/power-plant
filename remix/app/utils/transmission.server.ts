import { getJsonObject } from '~/utils/aws.server'

export const getTransmissionIp = async (): Promise<string | null> => {
  const { outputs } = (await getJsonObject(
    'power-plant-terraform',
    'global/s3/transmission/terraform.tfstate'
  )) as { outputs: { 'transmission-ec2-ip'?: { value: string } } }
  return outputs['transmission-ec2-ip']?.value ?? null
}

export const addTorrentFile = async (fileUrl: string) => {
  const ip = await getTransmissionIp()
  if (!ip) throw new Error('Transmission client is not running')
  const session = await fetch(`http://${ip}:9091/transmission/rpc`, {
    body: JSON.stringify({ method: 'session-get' }),
    method: 'POST'
  })
  const res = await fetch(`http://${ip}:9091/transmission/rpc`, {
    headers: {
      'x-transmission-session-id':
        session.headers.get('x-transmission-session-id') ?? ''
    },
    body: JSON.stringify({
      method: 'torrent-add',
      arguments: {
        paused: false,
        'download-dir': '/downloads/complete',
        filename: fileUrl
      }
    }),
    method: 'POST'
  })

  return res
}
