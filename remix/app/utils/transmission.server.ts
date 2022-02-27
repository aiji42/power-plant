import { getJsonObject } from '~/utils/aws.server'

export const getTransmissionEndpoint = async (): Promise<string | null> => {
  const { outputs } = (await getJsonObject(
    'power-plant-terraform',
    'global/s3/transmission/terraform.tfstate'
  )) as { outputs: { 'transmission-ec2-ip'?: { value: string } } }
  return outputs['transmission-ec2-ip']?.value
    ? `http://${outputs['transmission-ec2-ip'].value}:9091`
    : null
}
