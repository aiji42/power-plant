/**
 * @type {import('remix-esbuild-override').AppConfig}
 */
module.exports = {
  serverBuildTarget: 'cloudflare-workers',
  server: './server.js',
  devServerBroadcastDelay: 1000,
  ignoredRouteFiles: ['.*'],
  esbuildOverride: (option, { isServer }) => {
    if (isServer) option.mainFields = ['browser', 'module', 'main']

    return option
  }
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  // devServerPort: 8002
}
