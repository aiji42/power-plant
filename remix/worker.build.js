require('dotenv').config()
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
      'process.env.SUPABASE_API_KEY': `"${process.env.SUPABASE_API_KEY}"`
    }
  })
  .catch(() => process.exit(1))
