/* eslint-disable */
/**
 * Second test file for glob pattern matching
 * JavaScript file with various constructs
 */

// Class declaration
class DataProcessor {
  constructor(options = {}) {
    this.options = options;
    this.cache = new Map();
  }

  process(data) {
    const key = this.generateKey(data);
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const result = this.doProcess(data);
    this.cache.set(key, result);
    return result;
  }

  doProcess(data) {
    // Transform data based on options
    if (this.options.uppercase) {
      return data.toString().toUpperCase();
    }

    if (this.options.reverse) {
      return data.toString().split('').reverse().join('');
    }

    return data;
  }

  generateKey(data) {
    return typeof data + ':' + JSON.stringify(data);
  }

  clearCache() {
    this.cache.clear();
  }

  get cacheSize() {
    return this.cache.size;
  }
}

// Function declarations
function processArray(arr, processor) {
  if (!Array.isArray(arr)) {
    throw new Error('Expected array input');
  }

  return arr.map(item => processor.process(item));
}

function createProcessor(options) {
  return new DataProcessor(options);
}

// Arrow functions
const isValidInput = (input) => {
  return input !== null && input !== undefined;
};

const transformData = (data, options = {}) => {
  if (!isValidInput(data)) {
    return null;
  }

  const processor = createProcessor(options);
  return processor.process(data);
};

// Object with methods
const utils = {
  formatOutput(result) {
    if (typeof result === 'string') {
      return `"${result}"`;
    }
    return String(result);
  },

  logResult(result) {
    console.log('Processing result:', this.formatOutput(result));
  },

  async processAsync(data, options) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = transformData(data, options);
        resolve(result);
      }, 0);
    });
  }
};

// Exports
module.exports = {
  DataProcessor,
  processArray,
  createProcessor,
  transformData,
  utils
};