// Global Jest setup for the repo
import '@testing-library/jest-dom'

// Provide a minimal process.env test shim for tests if needed
if (typeof process !== 'undefined' && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test'
}
