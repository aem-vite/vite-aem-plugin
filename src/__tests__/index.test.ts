import { afterEach, describe, expect, it, vi } from 'vitest'

import * as helpers from '../helpers'
import { viteForAem } from '../index'

import type { Plugin, ResolvedConfig, UserConfig } from 'vite'
import type { PluginOptions } from '../types'

const baseOptions: PluginOptions = {
  contentPaths: ['we-retail'],
  publicPath: '/etc.clientlibs/we-retail/clientlibs/clientlib-site',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the main aem-vite plugin object from the array returned by viteForAem. */
function getMainPlugin(options: PluginOptions): Plugin {
  const plugins = viteForAem(options)
  return plugins.find(
    (p) => p && typeof p === 'object' && 'name' in p && p.name === 'aem-vite:vite-aem-plugin',
  ) as Plugin
}

/** Invokes the `config` hook with an optional partial UserConfig and returns the result. */
function invokeConfigHook(plugin: Plugin, config: UserConfig = {}): UserConfig {
  return (plugin.config as (c: UserConfig) => UserConfig)(config)
}

/** Invokes the `configResolved` hook with a partial ResolvedConfig. */
function invokeConfigResolvedHook(plugin: Plugin, config: Partial<ResolvedConfig>): void {
  ;(plugin.configResolved as (c: ResolvedConfig) => void)(config as ResolvedConfig)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('viteForAem', () => {
  it('throws when no options are provided', () => {
    expect(() => viteForAem(undefined as unknown as PluginOptions)).toThrow('No options were provided.')
  })

  it('throws when publicPath is missing', () => {
    const options = { contentPaths: ['we-retail'], publicPath: '' } as PluginOptions
    expect(() => viteForAem(options)).toThrow(
      'A public path is required for the proxy server to find and inject Vite DevServer!',
    )
  })

  it('returns an array of plugins', () => {
    const plugins = viteForAem(baseOptions)
    expect(Array.isArray(plugins)).toBe(true)
    expect(plugins.length).toBeGreaterThanOrEqual(1)
  })

  it('includes the aem-vite plugin by name', () => {
    const plugins = viteForAem(baseOptions)
    const mainPlugin = plugins.find(
      (p) => p && typeof p === 'object' && 'name' in p && p.name === 'aem-vite:vite-aem-plugin',
    )
    expect(mainPlugin).toBeDefined()
  })

  it('uses default AEM host and port when aem options are omitted', () => {
    expect(() => viteForAem(baseOptions)).not.toThrow()
  })

  it('accepts custom aem host and port', () => {
    const options: PluginOptions = {
      ...baseOptions,
      aem: { host: '192.168.1.10', port: 4503 },
    }
    expect(() => viteForAem(options)).not.toThrow()
  })

  it('includes import-rewriter plugin when rewriterOptions are provided', () => {
    const options: PluginOptions = {
      ...baseOptions,
      rewriterOptions: { minify: false },
    }
    const plugins = viteForAem(options)
    expect(plugins.length).toBeGreaterThan(1)
  })

  it('does not include import-rewriter plugin when rewriterOptions are absent', () => {
    const plugins = viteForAem(baseOptions)
    expect(plugins.length).toBe(1)
  })
})

// ─── config hook ─────────────────────────────────────────────────────────────

describe('viteForAem – config hook', () => {
  it('sets build.target to es2015 for maximum browser compatibility', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions))
    expect(result.build?.target).toBe('es2015')
  })

  it('preserves existing build options while adding target', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions), {
      build: { outDir: 'dist/custom', sourcemap: true },
    })
    expect(result.build?.outDir).toBe('dist/custom')
    expect(result.build?.sourcemap).toBe(true)
    expect(result.build?.target).toBe('es2015')
  })

  it('sets server.strictPort to true', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions))
    expect(result.server?.strictPort).toBe(true)
  })

  it('defaults server.open to true when not already set', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions))
    expect(result.server?.open).toBe(true)
  })

  it('preserves server.open when explicitly set to false', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions), {
      server: { open: false },
    })
    expect(result.server?.open).toBe(false)
  })

  it('adds exactly three proxy entries', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions))
    const proxyKeys = Object.keys(result.server?.proxy ?? {})
    expect(proxyKeys).toHaveLength(3)
  })

  it('includes a proxy entry for the content paths', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions))
    const proxyKeys = Object.keys(result.server?.proxy ?? {})
    expect(proxyKeys.some((k) => k.startsWith('^/content/'))).toBe(true)
  })

  it('includes a proxy entry for AEM request segments', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions))
    const proxyKeys = Object.keys(result.server?.proxy ?? {})
    // The segments proxy key starts with ^/ and contains known AEM paths
    expect(proxyKeys.some((k) => k.includes('apps') && k.includes('content'))).toBe(true)
  })

  it('includes a catch-all proxy entry for the root path', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions))
    const proxyKeys = Object.keys(result.server?.proxy ?? {})
    expect(proxyKeys).toContain('^/(index.html)?$')
  })

  it('marks the content-paths proxy as self-handling with HTTP protocol rewrite', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions))
    const proxy = result.server?.proxy ?? {}
    const contentKey = Object.keys(proxy).find((k) => k.startsWith('^/content/'))!
    const contentProxy = proxy[contentKey] as Record<string, unknown>
    expect(contentProxy.selfHandleResponse).toBe(true)
    expect(contentProxy.protocolRewrite).toBe('http')
  })

  it('targets the default AEM URL (localhost:4502) for all proxy entries', () => {
    const result = invokeConfigHook(getMainPlugin(baseOptions))
    const proxy = result.server?.proxy ?? {}
    for (const entry of Object.values(proxy)) {
      expect((entry as Record<string, unknown>).target).toBe('http://localhost:4502')
    }
  })

  it('builds the AEM URL from custom host and port options', () => {
    const options: PluginOptions = {
      ...baseOptions,
      aem: { host: 'aem-server.local', port: 4503 },
    }
    const result = invokeConfigHook(getMainPlugin(options))
    const proxy = result.server?.proxy ?? {}
    for (const entry of Object.values(proxy)) {
      expect((entry as Record<string, unknown>).target).toBe('http://aem-server.local:4503')
    }
  })

  it('scopes the content-paths proxy pattern to the configured contentPaths', () => {
    const options: PluginOptions = {
      ...baseOptions,
      contentPaths: ['my-site', 'other-site'],
    }
    const result = invokeConfigHook(getMainPlugin(options))
    const proxyKeys = Object.keys(result.server?.proxy ?? {})
    const contentKey = proxyKeys.find((k) => k.startsWith('^/content/'))!
    expect(contentKey).toContain('my-site')
    expect(contentKey).toContain('other-site')
  })

  it('prepends custom aemProxySegments before the built-in AEM segments', () => {
    const options: PluginOptions = {
      ...baseOptions,
      aemProxySegments: ['my-custom-segment'],
    }
    const result = invokeConfigHook(getMainPlugin(options))
    const proxyKeys = Object.keys(result.server?.proxy ?? {})
    const segmentsKey = proxyKeys.find((k) => k.includes('apps') && k.includes('content'))!
    expect(segmentsKey).toContain('my-custom-segment')
  })
})

// ─── configResolved hook ──────────────────────────────────────────────────────

describe('viteForAem – configResolved hook', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls setBundleEntries with a single-element array for a string input', () => {
    const spy = vi.spyOn(helpers, 'setBundleEntries')
    const plugin = getMainPlugin(baseOptions)
    invokeConfigResolvedHook(plugin, {
      build: { rollupOptions: { input: 'src/main.ts' } },
      plugins: [],
    })
    expect(spy).toHaveBeenCalledWith(['src/main.ts'])
  })

  it('calls setBundleEntries with a deduplicated array for an array input', () => {
    const spy = vi.spyOn(helpers, 'setBundleEntries')
    const plugin = getMainPlugin(baseOptions)
    invokeConfigResolvedHook(plugin, {
      build: { rollupOptions: { input: ['src/a.ts', 'src/a.ts', 'src/b.ts'] } },
      plugins: [],
    })
    expect(spy).toHaveBeenCalledWith(['src/a.ts', 'src/b.ts'])
  })

  it('calls setBundleEntries with Object.values() for an object/alias input', () => {
    const spy = vi.spyOn(helpers, 'setBundleEntries')
    const plugin = getMainPlugin(baseOptions)
    invokeConfigResolvedHook(plugin, {
      build: { rollupOptions: { input: { main: 'src/main.ts', vendor: 'src/vendor.ts' } } },
      plugins: [],
    })
    expect(spy).toHaveBeenCalledWith(['src/main.ts', 'src/vendor.ts'])
  })

  it('calls setResolvedConfig with the resolved Vite config', () => {
    const spy = vi.spyOn(helpers, 'setResolvedConfig')
    const plugin = getMainPlugin(baseOptions)
    const mockConfig = { build: { rollupOptions: { input: 'src/main.ts' } }, plugins: [] }
    invokeConfigResolvedHook(plugin, mockConfig)
    expect(spy).toHaveBeenCalledWith(mockConfig)
  })

  it('throws when rollupOptions.input is not provided', () => {
    const plugin = getMainPlugin(baseOptions)
    expect(() =>
      invokeConfigResolvedHook(plugin, {
        build: { rollupOptions: {} },
        plugins: [],
      }),
    ).toThrow('No input option(s) was provided via rollupOptions.input.')
  })

  it('throws when rollupOptions is absent entirely', () => {
    const plugin = getMainPlugin(baseOptions)
    expect(() =>
      invokeConfigResolvedHook(plugin, {
        build: {},
        plugins: [],
      }),
    ).toThrow('No input option(s) was provided via rollupOptions.input.')
  })

  it('throws when rollupOptions.input is an unsupported type', () => {
    const plugin = getMainPlugin(baseOptions)
    expect(() =>
      invokeConfigResolvedHook(plugin, {
        build: { rollupOptions: { input: 42 as unknown as string } },
        plugins: [],
      }),
    ).toThrow('Invalid value detected for rollupOptions.input.')
  })
})
