import { bundlesImportRewriter } from '@aem-vite/import-rewriter'

import { configureAemProxy, setResolvedConfig } from './helpers'

import type { PluginOption, ProxyOptions } from 'vite'
import type { PluginOptions } from './types'

export function viteForAem(options: PluginOptions): PluginOption[] {
  const aemOptions = options.aem
  const aemUrl = `http://${aemOptions?.host ?? 'localhost'}:${aemOptions?.port ?? 4502}`

  if (!options.publicPath || !options.publicPath.length) {
    throw new Error('A public path is required for the proxy server to find and inject Vite DevServer!')
  }

  const plugins: PluginOption[] = [
    {
      enforce: 'pre',
      name: 'aem-vite:vite-aem-plugin',

      config(config) {
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

        config.build = {
          ...(config.build || {}),

          // Always prefer maximum browser compatibility
          target: 'es2015',
        }

        config.server = {
          ...(config.server || {}),

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
            '^/(aem|apps|bin|conf|content|crx|etc|etc.clientlibs|home|libs|mnt|system|var|(assets|editor|sites|screens)\\.html)/.*':
              {
                ...baseProxyOptions,
              },

            // Handle the initial interaction between the Vite DevServer and AEM
            '^/(index.html)?$': {
              ...baseProxyOptions,
              followRedirects: true,
            },
          },
        }

        return config
      },

      configResolved(config) {
        setResolvedConfig(config)
      },
    },
  ]

  // Enable the import rewriter when options are passed through
  if (options.rewriterOptions) {
    const { caching, minify, resourcesPath } = options.rewriterOptions

    plugins.push(
      bundlesImportRewriter({
        caching,
        publicPath: options.publicPath,
        minify,
        resourcesPath,
      }),
    )
  }

  return plugins
}
