import type { Plugin, ResolvedConfig } from 'vite'

import type { ViteForAemOptions } from './types'

export function viteForAem(options: ViteForAemOptions): Plugin {
  let resolvedConfig: ResolvedConfig

  const aemOptions = options.aem
  const aemUrl = `http://${aemOptions?.host ?? 'localhost'}:${aemOptions?.port ?? 4602}`

  return {
    enforce: 'pre',
    name: 'aem-vite:vite-aem-plugin',

    config(config, { command, mode }) {
      if (config.server) {
        config.server.host = options.vite.host
        config.server.open = true
        config.server.origin = options.vite.origin || aemUrl
        config.server.port = options.vite.port
        config.server.strictPort = true

        config.server.headers = {
          Host: aemUrl.replace(/(^\w+:|^)\/\//, ''),
          Referer: aemUrl,
          Origin: aemUrl,
        }
      }
    },

    configResolved(config) {
      resolvedConfig = config
    },

    configureServer(server) {
      server.middlewares.on('proxyRes', (...args) => {
        console.log(args)
      })

      server.middlewares.use((req, res, next) => {
        console.log(resolvedConfig.base, options, req.url)

        next()
      })
    },
  }
}
