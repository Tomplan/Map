// Global Jest setup for the repo
import '@testing-library/jest-dom';

// Node's TextEncoder/TextDecoder may be missing in some jest environments
// Add polyfills so consumers (e.g. react-router, encoding) can run in jest
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

// Provide a minimal process.env test shim for tests if needed
if (typeof process !== 'undefined' && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Polyfill structuredClone for fake-indexeddb which requires it
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}
