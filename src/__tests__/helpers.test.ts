import { describe, expect, it } from 'vitest'

import { getKeyFormatExpressions, isObject } from '../helpers'

import type { PluginOptions } from '../types'

const baseOptions: PluginOptions = {
  contentPaths: ['we-retail'],
  publicPath: '/etc.clientlibs/we-retail/clientlibs/clientlib-site',
}

describe('isObject', () => {
  it('returns true for a plain empty object', () => {
    expect(isObject({})).toBe(true)
  })

  it('returns true for a plain object with properties', () => {
    expect(isObject({ key: 'value' })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isObject(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isObject(undefined)).toBe(false)
  })

  it('returns false for a string', () => {
    expect(isObject('string')).toBe(false)
  })

  it('returns false for a number', () => {
    expect(isObject(42)).toBe(false)
  })

  it('returns false for an array', () => {
    expect(isObject([])).toBe(false)
  })

  it('returns false for a boolean', () => {
    expect(isObject(true)).toBe(false)
  })
})

describe('getKeyFormatExpressions', () => {
  it('returns all three default expressions when no custom list is provided', () => {
    const result = getKeyFormatExpressions(baseOptions)
    expect(result).toContain('lc-\\w{32}-lc(.min)?)')
    expect(result).toContain('((min.)?ACSHASH\\w{32})')
    expect(result).toContain('(\\w{32}(.min)?')
  })

  it('returns exactly the three defaults when keyFormatExpressions is an empty array', () => {
    const options: PluginOptions = { ...baseOptions, keyFormatExpressions: [] }
    const result = getKeyFormatExpressions(options)
    expect(result).toHaveLength(3)
  })

  it('places custom expressions before the defaults', () => {
    const options: PluginOptions = {
      ...baseOptions,
      keyFormatExpressions: ['(custom\\w{8})'],
    }
    const result = getKeyFormatExpressions(options)
    expect(result.indexOf('(custom\\w{8})')).toBeLessThan(result.indexOf('lc-\\w{32}-lc(.min)?)'))
  })

  it('includes custom expressions alongside all defaults', () => {
    const options: PluginOptions = {
      ...baseOptions,
      keyFormatExpressions: ['(custom\\w{8})'],
    }
    const result = getKeyFormatExpressions(options)
    expect(result).toContain('(custom\\w{8})')
    expect(result).toContain('lc-\\w{32}-lc(.min)?)')
    expect(result).toContain('((min.)?ACSHASH\\w{32})')
    expect(result).toContain('(\\w{32}(.min)?')
  })

  it('deduplicates expressions that appear in both custom and default lists', () => {
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
