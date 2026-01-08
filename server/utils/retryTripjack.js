// Utility function to retry an asynchronous operation

async function retry(fn, retries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise(res => setTimeout(res, delay));
    }
  }

  throw lastError;
}

module.exports = retry;
