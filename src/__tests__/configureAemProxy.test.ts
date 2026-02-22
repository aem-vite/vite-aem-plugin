/**
 * Tests for configureAemProxy().
 *
 * The proxy handler is the core business logic of this plugin: it intercepts AEM HTML responses,
 * strips ClientLib <script>/<link> tags, and injects the Vite DevServer entry points.
 *
 * What we deliberately do NOT test here:
 *  - The actual HTTP proxy server (vite-dev-server / http-proxy responsibility)
 *  - Network behaviour (connect/disconnect, timeouts, etc.)
 *  - The import-rewriter plugin (@aem-vite/import-rewriter responsibility)
 */
import zlib from 'node:zlib'
import { describe, expect, it, vi } from 'vitest'

import { configureAemProxy, setBundleEntries, setResolvedConfig } from '../helpers'

import type { HttpProxy, ResolvedConfig } from 'vite'
import type { PluginOptions } from '../types'

// ─── Module-level state ──────────────────────────────────────────────────────
// setResolvedConfig / setBundleEntries are "set-once" guards. Calling them here,
// before any tests, satisfies getViteScripts() and replaceUrl() for every test in
// this file. Each test file gets an isolated module context so this doesn't leak.

setResolvedConfig({
  plugins: [],
  base: '/',
  server: { host: 'localhost', port: 3000 },
} as unknown as ResolvedConfig)

setBundleEntries(['src/main.ts'])

// ─── Constants ───────────────────────────────────────────────────────────────

const AEM_URL = 'http://localhost:4502'
const VITE_URL = 'http://localhost:3000'

const baseOptions: PluginOptions = {
  contentPaths: ['we-retail'],
  publicPath: '/etc.clientlibs/we-retail/clientlibs/clientlib-site',
}

const HTML_HEADERS = { 'content-type': 'text/html; charset=utf-8' }
const JSON_HEADERS = { 'content-type': 'application/json' }

// Clientlib tags that the regex should match given baseOptions.publicPath
const CLIENTLIB_SCRIPT = '<script src="/etc.clientlibs/we-retail/clientlibs/clientlib-site.js"></script>'
const CLIENTLIB_LINK = '<link rel="stylesheet" href="/etc.clientlibs/we-retail/clientlibs/clientlib-site.css">'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeHtml(inner: string) {
  return `<html><head>${inner}</head><body></body></html>`
}

/** Lightweight stand-in for HttpProxy.Server that captures registered handlers. */
function createMockProxy() {
  let proxyResHandler: ((...args: unknown[]) => void) | undefined
  let errorHandler: ((...args: unknown[]) => void) | undefined
  return {
    on(event: string, handler: (...args: unknown[]) => void) {
      if (event === 'proxyRes') proxyResHandler = handler
      if (event === 'error') errorHandler = handler
    },
    triggerProxyRes(...args: unknown[]) {
      proxyResHandler?.(...args)
    },
    triggerError(...args: unknown[]) {
      errorHandler?.(...args)
    },
  }
}

/** Minimal http.ServerResponse mock that records header writes and body. */
function createMockRes() {
  const mock = {
    statusCode: 200,
    headers: {} as Record<string, string | string[]>,
    setHeader(name: string, value: string | string[]) {
      mock.headers[name.toLowerCase()] = value
    },
    removeHeader: vi.fn(),
    writeHead: vi.fn(),
    end: vi.fn(),
  }
  return mock
}

/**
 * Minimal IncomingMessage mock whose data/end events can be fired synchronously
 * via flush(), making the async proxy response handler testable without real streams.
 */
function createMockProxyRes(opts: {
  statusCode?: number
  headers: Record<string, string | string[] | undefined>
  body?: string
}) {
  const { statusCode = 200, headers, body = '' } = opts
  const dataHandlers: ((chunk: Buffer) => void)[] = []
  const endHandlers: (() => void)[] = []
  return {
    statusCode,
    headers,
    pipe: vi.fn(),
    on(event: string, handler: (...args: unknown[]) => void) {
      if (event === 'data') dataHandlers.push(handler as (chunk: Buffer) => void)
      if (event === 'end') endHandlers.push(handler as () => void)
    },
    /** Synchronously emit the data + end events with the given (or default) payload. */
    flush(data?: Buffer) {
      const buf = data ?? Buffer.from(body)
      dataHandlers.forEach((h) => h(buf))
      endHandlers.forEach((h) => h())
    },
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('configureAemProxy', () => {
  it('returns a function that accepts a proxy server', () => {
    const result = configureAemProxy(AEM_URL, baseOptions)
    expect(typeof result).toBe('function')
  })

  // ── error handler ──────────────────────────────────────────────────────────

  describe('error handler', () => {
    it('responds with HTTP 500 when the upstream connection fails', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const res = { writeHead: vi.fn(), end: vi.fn() }
      proxy.triggerError(new Error('ECONNREFUSED'), {}, res)

      expect(res.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'text/plain' })
    })

    it('includes the original error message in the 500 response body', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const res = { writeHead: vi.fn(), end: vi.fn() }
      proxy.triggerError(new Error('ECONNREFUSED: connection refused'), {}, res)

      expect(res.end).toHaveBeenCalledWith(expect.stringContaining('ECONNREFUSED: connection refused'))
    })
  })

  // ── proxyRes handler ───────────────────────────────────────────────────────

  describe('proxyRes handler', () => {
    it('forwards the upstream HTTP status code to the client', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const proxyRes = createMockProxyRes({ statusCode: 301, headers: JSON_HEADERS })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/content/we-retail/en.html' }, res)

      expect(res.statusCode).toBe(301)
    })

    it('pipes non-HTML responses through without modification', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const proxyRes = createMockProxyRes({ headers: JSON_HEADERS, body: '{"ok":true}' })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/bin/api.json' }, res)

      expect(proxyRes.pipe).toHaveBeenCalledWith(res)
      expect(res.end).not.toHaveBeenCalled()
    })

    it('passes HTML through unchanged when no clientlib tags are matched', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const html = makeHtml('<script src="/@vite/client"></script>')
      const proxyRes = createMockProxyRes({ headers: HTML_HEADERS, body: html })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/content/we-retail/en.html' }, res)
      proxyRes.flush()

      expect(res.end).toHaveBeenCalledOnce()
      // Unmodified path ends with the raw binary string representation
      expect(res.end).toHaveBeenCalledWith(Buffer.from(html).toString('binary'))
    })

    it('replaces a matched clientlib <script> tag with Vite DevServer entries', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const html = makeHtml(CLIENTLIB_SCRIPT)
      const proxyRes = createMockProxyRes({ headers: HTML_HEADERS, body: html })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/content/we-retail/en.html' }, res)
      proxyRes.flush()

      const body = res.end.mock.calls[0][0] as string
      expect(body).toContain('/@vite/client')
      expect(body).toContain('/src/main.ts')
      expect(body).not.toContain(CLIENTLIB_SCRIPT)
    })

    it('replaces a matched clientlib <link> tag with Vite DevServer entries', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const html = makeHtml(CLIENTLIB_LINK)
      const proxyRes = createMockProxyRes({ headers: HTML_HEADERS, body: html })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/content/we-retail/en.html' }, res)
      proxyRes.flush()

      const body = res.end.mock.calls[0][0] as string
      expect(body).toContain('/@vite/client')
      expect(body).not.toContain(CLIENTLIB_LINK)
    })

    it('removes intermediate clientlib matches and replaces only the last one', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const html = makeHtml(`${CLIENTLIB_LINK}\n${CLIENTLIB_SCRIPT}`)
      const proxyRes = createMockProxyRes({ headers: HTML_HEADERS, body: html })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/content/we-retail/en.html' }, res)
      proxyRes.flush()

      const body = res.end.mock.calls[0][0] as string
      // Both original tags must be absent
      expect(body).not.toContain(CLIENTLIB_LINK)
      expect(body).not.toContain(CLIENTLIB_SCRIPT)
      // The Vite client script must appear exactly once
      const viteClientOccurrences = (body.match(/\/@vite\/client/g) ?? []).length
      expect(viteClientOccurrences).toBe(1)
    })

    it('uses clientlibsExpression option as the path prefix for matching when provided', () => {
      // clientlibsExpression is a regex string: the group matches either clientlib name
      const options: PluginOptions = {
        ...baseOptions,
        clientlibsExpression: '/etc.clientlibs/we-retail/clientlibs/(clientlib-site|clientlib-vendor)',
      }

      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, options)(proxy as unknown as HttpProxy.Server)

      // A tag whose src matches the clientlibsExpression pattern (the vendor lib)
      const vendorScriptTag = '<script src="/etc.clientlibs/we-retail/clientlibs/clientlib-vendor.js"></script>'
      const html = makeHtml(vendorScriptTag)
      const proxyRes = createMockProxyRes({ headers: HTML_HEADERS, body: html })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/content/we-retail/en.html' }, res)
      proxyRes.flush()

      const body = res.end.mock.calls[0][0] as string
      expect(body).toContain('/@vite/client')
      expect(body).not.toContain(vendorScriptTag)
    })

    it('does not match tags whose path starts with publicPath when clientlibsExpression differs', () => {
      const options: PluginOptions = {
        ...baseOptions,
        clientlibsExpression: '/etc.clientlibs/other-project/clientlibs/other-lib',
      }

      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, options)(proxy as unknown as HttpProxy.Server)

      // Tag uses publicPath, not clientlibsExpression → should NOT match
      const html = makeHtml(CLIENTLIB_SCRIPT)
      const proxyRes = createMockProxyRes({ headers: HTML_HEADERS, body: html })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/content/we-retail/en.html' }, res)
      proxyRes.flush()

      const body = res.end.mock.calls[0][0] as string
      // HTML is unmodified; no Vite injection
      expect(body).not.toContain('/@vite/client')
    })

    it('rewrites the AEM URL to the Vite server URL in scalar response headers', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const proxyRes = createMockProxyRes({
        headers: {
          ...JSON_HEADERS,
          location: `${AEM_URL}/content/we-retail/en.html`,
        },
      })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/content/we-retail/en.html' }, res)

      expect(res.headers['location']).toBe(`${VITE_URL}/content/we-retail/en.html`)
    })

    it('rewrites the AEM URL in every element of array-valued response headers', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const proxyRes = createMockProxyRes({
        headers: {
          ...JSON_HEADERS,
          'x-link': [`${AEM_URL}/a`, `${AEM_URL}/b`],
        },
      })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/api/data' }, res)

      expect(res.headers['x-link']).toEqual([`${VITE_URL}/a`, `${VITE_URL}/b`])
    })

    it('decompresses gzip-encoded HTML before processing clientlib tags', () => {
      const proxy = createMockProxy()
      configureAemProxy(AEM_URL, baseOptions)(proxy as unknown as HttpProxy.Server)

      const gzipped = zlib.gzipSync(Buffer.from(makeHtml(CLIENTLIB_SCRIPT)))
      const proxyRes = createMockProxyRes({
        headers: { ...HTML_HEADERS, 'content-encoding': 'gzip' },
      })
      const res = createMockRes()
      proxy.triggerProxyRes(proxyRes, { url: '/content/we-retail/en.html' }, res)
      proxyRes.flush(gzipped)

      const body = res.end.mock.calls[0][0] as string
      expect(body).toContain('/@vite/client')
      expect(body).not.toContain(CLIENTLIB_SCRIPT)
    })
  })
})
