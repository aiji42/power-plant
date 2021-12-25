import { handlerPath } from '@libs/handlerResolver'

const environment = {
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
