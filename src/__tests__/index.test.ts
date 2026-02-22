import { describe, expect, it } from 'vitest'

import { viteForAem } from '../index'

import type { PluginOptions } from '../types'

const baseOptions: PluginOptions = {
  contentPaths: ['we-retail'],
  publicPath: '/etc.clientlibs/we-retail/clientlibs/clientlib-site',
}

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
    // Should not throw; default URL http://localhost:4502 is used internally
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
    // Only the core aem-vite plugin should be present
    expect(plugins.length).toBe(1)
  })
})
