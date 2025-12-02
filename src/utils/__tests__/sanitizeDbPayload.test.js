import { sanitizeDbPayload } from '../dataExportImport'

describe('sanitizeDbPayload', () => {
  test('removes underscore-prefixed keys from an object', () => {
    const input = { id: 1, name: 'Test', _categorySlugs: ['a', 'b'], _translations: { nl: 'x' } }
    const out = sanitizeDbPayload(input)
    expect(out).toEqual({ id: 1, name: 'Test' })
  })

  test('works on arrays of objects', () => {
    const input = [ { id: 1, _foo: 1 }, { id: 2, name: 'Ok', _bar: true } ]
    const out = sanitizeDbPayload(input)
    expect(out).toEqual([ { id: 1 }, { id: 2, name: 'Ok' } ])
  })

  test('returns non-objects unchanged', () => {
    expect(sanitizeDbPayload(null)).toBeNull()
    expect(sanitizeDbPayload('x')).toBe('x')
    expect(sanitizeDbPayload(123)).toBe(123)
  })
})
