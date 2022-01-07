require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env'
})
const alias = require('esbuild-plugin-alias')
const isProd = process.env.NODE_ENV === 'production'

require('esbuild')
  .build({
    entryPoints: ['./worker'],
    bundle: true,
    sourcemap: true,
    minify: isProd,
    outdir: 'dist',
    define: {
      'process.env.NODE_ENV': `"${process.env.NODE_ENV ?? 'development'}"`,
      'process.env.SUPABASE_URL': `"${process.env.SUPABASE_URL}"`,
      'process.env.SUPABASE_API_KEY': `"${process.env.SUPABASE_API_KEY}"`,
      'process.env.BATCH_JOB_SLS_ENDPOINT': `"${process.env.BATCH_JOB_SLS_ENDPOINT}"`,
      'process.env.PROVIDER_F_API_ID': `"${process.env.PROVIDER_F_API_ID}"`,
      'process.env.PROVIDER_F_AFF_ID': `"${process.env.PROVIDER_F_AFF_ID}"`,
      'process.env.AWS_ACCESS_KEY_ID': `"${process.env.AWS_ACCESS_KEY_ID}"`,
      'process.env.AWS_SECRET_ACCESS_KEY': `"${process.env.AWS_SECRET_ACCESS_KEY}"`,
      'process.env.AWS_DEFAULT_REGION': `"${process.env.AWS_DEFAULT_REGION}"`,
      'process.env.JOB_DEFINITION': `"${process.env.JOB_DEFINITION}"`,
      'process.env.JOB_QUEUE': `"${process.env.JOB_QUEUE}"`
    },
    plugins: [
      alias({
        'node-html-parser': require.resolve('node-html-parser')
      })
    ]
  })
  .catch(() => process.exit(1))
