import _debug from 'debug'
import zlib from 'zlib'

import viteReact from '@vitejs/plugin-react'

import type { HttpProxy, ResolvedConfig } from 'vite'
import type { PluginOptions } from './types'

const prefix = '[vite-aem-plugin]'

let bundleEntries: string[]
let resolvedConfig: ResolvedConfig

export const debug = _debug('vite-aem-plugin')

export function isObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

/**
 * Retrieves the Vite DevServer `link`/`script` tags.
 *
 * @returns Vite DevServer tags
 */
function getViteScripts() {
  const entries: string[] = []

  for (const source of bundleEntries) {
    if (/\.(js|ts)x?/.test(source)) {
      entries.push(`<script type="module" src="/${source}"></script>`)
    } else if (/\.(css|less|sass|scss|postcss)/.test(source)) {
      entries.push(`<link rel="stylesheet" href="/${source}"/>`)
    }
  }

  let scripts = `
<script type="module" src="/@vite/client"></script>
${entries.join('\n')}
`

  const isUsingReact = resolvedConfig.plugins.find(({ name }) => name === 'vite:react-refresh')

  if (isUsingReact) {
    scripts += `
<script type="module">
  ${viteReact.preambleCode.replace('__BASE__', resolvedConfig.base)}
</script>
    `
  }

  return scripts
}

/**
 * Replace the AEM URL with the Vite DevServer URL to prevent any weird redirect bugs.
 *
 * @param input header value
 * @param aemUrl target url for the AEM instance
 * @returns an updated header value without the AEM URL
 */
function replaceUrl(input: string | undefined, aemUrl: string) {
  return (input || '').replace(aemUrl, `http://${resolvedConfig.server.host}:${resolvedConfig.server.port}`)
}

export function setBundleEntries(entries: string[]) {
  if (!bundleEntries) {
    bundleEntries = entries
  }
}

/**
 * Store the resolved Vite configuration so we can use it elsewhere.
 *
 * @param config resolved Vite configuration
 */
export function setResolvedConfig(config: ResolvedConfig) {
  if (!resolvedConfig) {
    resolvedConfig = config
  }
}

/**
 * Handles the proxy interactions between Vite and AEM to generate custom responses.
 * Inspired by https://github.com/adobe/aem-site-theme-builder.
 *
 * @param aemUrl target url for the AEM instance
 * @param options AEM Vite options
 * @param config current Vite configuration
 * @returns an HTTP proxy callback
 */
export function configureAemProxy(aemUrl: string, options: PluginOptions) {
  const clientlibsExpression = new RegExp(
    `<(?:script|link).*(?:src|href)="${
      options.clientlibsExpression ?? options.publicPath
    }.(?:css|js)"(([\\w+])=['"]([^'"]*)['"][^>]*>|[^>]*></script>|>)`,
    'g',
  )

  return (proxy: HttpProxy.Server) => {
    proxy.on('proxyRes', (proxyRes, req, res) => {
      const requestUrl = req.url as string
      const proxyHeaders = proxyRes && proxyRes.headers

      const isHtmlRequest =
        proxyHeaders &&
        proxyHeaders['content-type'] &&
        proxyHeaders['content-type'].match(/(text\/html|application\/xhtml+xml)/)

      const isGzipedRequest =
        proxyHeaders && proxyHeaders['content-encoding'] && proxyHeaders['content-encoding'].includes('gzip')

      let cookieHeader = proxyHeaders && proxyHeaders['set-cookie']

      // Pass-through the status code
      res.statusCode = proxyRes.statusCode || 200

      if (isHtmlRequest) {
        const body: Uint8Array[] = []

        proxyRes.on('data', (chunk) => body.push(chunk))

        proxyRes.on('end', () => {
          const data = Buffer.concat(body)
          const html = isGzipedRequest ? zlib.unzipSync(data).toString() : data.toString()

          debug('parsing request for:', requestUrl)
          debug('content length', html.length)

          const matches = html.match(clientlibsExpression)

          debug('total clientlib matches:', matches?.length ?? 0)

          let replacedHtml = html

          if (matches) {
            debug('stripping matched clientlibs:', matches)

            matches.forEach((match, index) => {
              // Replace the last matched ClientLib with the Vite DevServer script tags
              replacedHtml = replacedHtml.replace(match, index === matches.length - 1 ? getViteScripts() : '')
            })
          }

          const isHtmlModified = replacedHtml.length !== html.length

          debug('has content changed?', isHtmlModified ? 'yes' : 'no')

          if (isHtmlModified) {
            try {
              res.setHeader('content-encoding', '')
              res.setHeader('content-type', 'text/html')
              res.removeHeader('content-length')
              res.end(replacedHtml)

              debug(`proxy ${requestUrl} with Vite DevServer entries`)
            } catch (err) {
              console.error('Something went wrong!\n\n', err.message)
            }
          } else {
            res.end(data.toString('binary'))

            debug(`proxy ${requestUrl} without changes.`)
          }
        })
      } else {
        proxyRes.pipe(res)
      }

      // Remove the `secure` attribute from cookies to support Chrome
      if (cookieHeader) {
        cookieHeader = cookieHeader.map((val) => val.replace('Secure;', ''))
      }

      // Set headers to be sent to client
      for (const header in proxyHeaders) {
        const headerValue = proxyHeaders[header]

        if (Array.isArray(headerValue)) {
          res.setHeader(
            header,
            headerValue.map((h) => replaceUrl(h, aemUrl)),
          )
        } else {
          res.setHeader(header, replaceUrl(headerValue, aemUrl))
        }
      }
    })

    proxy.on('error', (err, _req, res) => {
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      })

      res.end(`${prefix} Something went wrong!\n\n${err.message}`)
    })
  }
}
