import { bundlesImportRewriter } from '@aem-vite/import-rewriter'

import { configureAemProxy, debug, isObject, setBundleEntries, setResolvedConfig } from './helpers'

import type { PluginOption, ProxyOptions } from 'vite'
import type { PluginOptions } from './types'

export function viteForAem(options: PluginOptions): PluginOption[] {
  if (!options) {
    throw new Error('No options were provided.')
  }

  const aemOptions = options.aem
  const aemUrl = `http://${aemOptions?.host ?? 'localhost'}:${aemOptions?.port ?? 4502}`

  if (!options.publicPath || !options.publicPath.length) {
    throw new Error('A public path is required for the proxy server to find and inject Vite DevServer!')
  }

  debug('using AEM URL: %s', aemUrl)
  debug('options:', aemOptions)

  const aemProxySegments = [
    ...(options.aemProxySegments ?? []),
    'aem',
    'apps',
    'bin',
    'conf',
    'content',
    'crx',
    'etc',
    'etc.clientlibs',
    'home',
    'libs',
    'login',
    'mnt',
    'system',
    'var',
    '(assets|editor|sites|screens)',
  ]

  const aemProxySegmentsExp = new RegExp(`^/(${aemProxySegments.join('|')}(.html)?)/.*`).source

  const aemContentPathsExp = `^/content/(${options.contentPaths.join('|')})(/.*)?`

  debug('aem content paths:', aemContentPathsExp)
  debug('aem request segments:', aemProxySegmentsExp)

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

        debug('proxy options:', baseProxyOptions)

        config.build = {
          ...(config.build || {}),

          // Always prefer maximum browser compatibility
          target: 'es2015',
        }

        config.server = {
          ...(config.server || {}),

          open: config.server?.open ?? true,
          strictPort: true,

          proxy: {
            [aemContentPathsExp]: {
              ...baseProxyOptions,
              protocolRewrite: 'http',
              selfHandleResponse: true,

              // Use a proxy response handler to dynamically change the response content for specific pages
              configure: configureAemProxy(aemUrl, options),
            },

            // Handle all other AEM based requests
            [aemProxySegmentsExp]: {
              ...baseProxyOptions,
            },

            // Handle the initial interaction between the Vite DevServer and AEM
            '^/(index.html)?$': {
              ...baseProxyOptions,
            },
          },
        }

        return config
      },

      configResolved(config) {
        setResolvedConfig(config)

        const buildInput = config.build.rollupOptions?.input

        let bundleEntries: string[] = []

        if (buildInput) {
          if (typeof buildInput === 'string') {
            bundleEntries = [buildInput]
          } else if (Array.isArray(buildInput)) {
            bundleEntries = [...new Set(buildInput)]
          } else if (isObject(buildInput)) {
            bundleEntries = Object.values(buildInput)
          } else {
            throw new Error(
              'Invalid value detected for rollupOptions.input. Please ensure it is a string, array or alias object.',
            )
          }
        } else {
          throw new Error('No input option(s) was provided via rollupOptions.input.')
        }

        setBundleEntries(bundleEntries)
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
