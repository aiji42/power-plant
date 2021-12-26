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
      'process.env.BATCH_JOB_SLS_ENDPOINT': `"${process.env.BATCH_JOB_SLS_ENDPOINT}"`
    },
    plugins: [
      alias({
        'node-html-parser': require.resolve('node-html-parser')
      })
    ]
  })
  .catch(() => process.exit(1))
