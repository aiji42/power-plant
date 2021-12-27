import { APIGatewayProxyHandler } from 'aws-lambda'
import { BatchClient, SubmitJobCommand } from '@aws-sdk/client-batch'

const client = new BatchClient({ region: process.env.AWS_DEFAULT_REGION })

const corsHeader = {
  'Access-Control-Allow-Origin': '*'
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const id = event.pathParameters?.productId ?? ''

  try {
    const command = new SubmitJobCommand({
      jobName: `power-plant-${id}`,
      jobDefinition: process.env.JOB_DEFINITION,
      jobQueue: process.env.JOB_QUEUE,
      timeout: {
        attemptDurationSeconds: 2700
      },
      containerOverrides: {
        vcpus: 1,
        memory: 1024,
        command: ['ts-node', '/script.ts', id]
      }
    })
    const res = await client.send(command)
    console.log(res)
  } catch (e) {
    console.log(e)

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'failed' }),
      headers: { ...corsHeader }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'succeed' }),
    headers: { ...corsHeader }
  }
}
