import { bundlesImportRewriter } from '@aem-vite/import-rewriter'

import { configureAemProxy, setResolvedConfig } from './helpers'

import type { Plugin, ProxyOptions, UserConfig } from 'vite'
import type { PluginOptions } from './types'

export function viteForAem(options: PluginOptions): Plugin {
  const aemOptions = options.aem
  const aemUrl = `http://${aemOptions?.host ?? 'localhost'}:${aemOptions?.port ?? 4602}`

  if (!options.publicPath || !options.publicPath.length) {
    throw new Error('A public path is required for the proxy server to find and inject Vite DevServer!')
  }

  return {
    enforce: 'pre',
    name: 'aem-vite:vite-aem-plugin',

    config() {
      const baseProxyOptions: ProxyOptions = {
        autoRewrite: true,
        changeOrigin: true,
        preserveHeaderKeyCase: true,
        secure: false,
        target: aemUrl,

        // These headers makes AEM believe that all requests are been made internally. This is important
        // to ensure that redirects and such behave correctly.
        headers: {
          Host: aemUrl.replace(/(^\w+:|^)\/\//, ''),
          Origin: aemUrl,
          Referer: aemUrl,
        },
      }

      const newConfig: UserConfig = {
        server: {
          open: true,
          strictPort: true,

          proxy: {
            [`^/content/(${options.contentPaths.join('|')})/.*`]: {
              ...baseProxyOptions,
              protocolRewrite: 'http',
              selfHandleResponse: true,

              // Use a proxy response handler to dynamically change the response content for specific pages
              configure: configureAemProxy(aemUrl, options),
            },

            // Handle all other AEM based requests
            '^/(aem|apps|conf|content|crx|etc|etc.clientlibs|home|libs|mnt|system|var)/.*': {
              ...baseProxyOptions,
            },

            // Handle the initial interaction between the Vite DevServer and AEM
            '^/(index.html)?$': {
              ...baseProxyOptions,
              followRedirects: true,
            },
          },
        },
      }

      // Enable the import rewriter when options are passed through
      if (options.rewriterOptions && newConfig.plugins) {
        const { caching, minify, resourcesPath } = options.rewriterOptions

        newConfig.plugins.push(
          bundlesImportRewriter({
            caching,
            publicPath: options.publicPath,
            minify,
            resourcesPath,
          }),
        )
      }

      return newConfig
    },

    configResolved(config) {
      setResolvedConfig(config)
    },
  }
}
