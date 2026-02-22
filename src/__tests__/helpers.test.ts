import { describe, expect, it } from 'vitest'

import { getKeyFormatExpressions, isObject } from '../helpers'

import type { PluginOptions } from '../types'

const baseOptions: PluginOptions = {
  contentPaths: ['we-retail'],
  publicPath: '/etc.clientlibs/we-retail/clientlibs/clientlib-site',
}

describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ key: 'value' })).toBe(true)
  })

  it('returns false for non-objects', () => {
    expect(isObject(null)).toBe(false)
    expect(isObject(undefined)).toBe(false)
    expect(isObject('string')).toBe(false)
    expect(isObject(42)).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isObject(true)).toBe(false)
  })
})

describe('getKeyFormatExpressions', () => {
  it('returns default expressions when none are provided', () => {
    const result = getKeyFormatExpressions(baseOptions)
    expect(result).toContain('lc-\\w{32}-lc(.min)?)')
    expect(result).toContain('((min.)?ACSHASH\\w{32})')
    expect(result).toContain('(\\w{32}(.min)?')
  })

  it('includes custom expressions alongside defaults', () => {
    const options: PluginOptions = {
      ...baseOptions,
      keyFormatExpressions: ['(custom\\w{8})'],
    }
    const result = getKeyFormatExpressions(options)
    expect(result).toContain('(custom\\w{8})')
    expect(result).toContain('lc-\\w{32}-lc(.min)?)')
  })

  it('deduplicates expressions', () => {
    const duplicate = 'lc-\\w{32}-lc(.min)?)'
    const options: PluginOptions = {
      ...baseOptions,
      keyFormatExpressions: [duplicate],
    }
    const result = getKeyFormatExpressions(options)
    expect(result.filter((e) => e === duplicate)).toHaveLength(1)
  })

  it('throws when keyFormatExpressions is not an array', () => {
    const options = {
      ...baseOptions,
      keyFormatExpressions: 'not-an-array',
    } as unknown as PluginOptions
    expect(() => getKeyFormatExpressions(options)).toThrow('options.keyFormatExpressions must be an array of strings.')
  })
})
