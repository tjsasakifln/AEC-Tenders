// Jest setup file for AEC Tenders tests
// This file runs before each test suite

// Global test configuration
global.console = {
  ...console,
  // Silence console.log during tests unless needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};