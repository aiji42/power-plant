import { handlerPath } from '@libs/handlerResolver'

const environment = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
  JOB_DEFINITION: process.env.JOB_DEFINITION,
  JOB_QUEUE: process.env.JOB_QUEUE
}

export default {
  handler: `${handlerPath(__dirname)}/handler.handler`,
  events: [
    {
      http: {
        method: 'get',
        path: '/product/handle/{productId}',
        cors: true
      }
    }
  ],
  timeout: 60,
  environment: {
    ...environment
  }
}
