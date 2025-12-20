const { FingerprintJsServerApiClient, Region } = require('@fingerprintjs/fingerprintjs-pro-server-api');

// Initialize client only if secret key is available
let client = null;

function getClient() {
  if (!client && process.env.FINGERPRINT_SECRET_API_KEY) {
    client = new FingerprintJsServerApiClient({
      apiKey: process.env.FINGERPRINT_SECRET_API_KEY,
      region: Region[process.env.FINGERPRINT_REGION || 'Global']
    });
  }
  return client;
}

module.exports = {
  async getEvent(requestId) {
    const apiClient = getClient();
    if (!apiClient) {
      throw new Error('FingerprintJS API key not configured');
    }
    return await apiClient.getEvent(requestId);
  },
  
  async getVisitorHistory(visitorId, options = {}) {
    const apiClient = getClient();
    if (!apiClient) {
      throw new Error('FingerprintJS API key not configured');
    }
    return await apiClient.getVisitorHistory(visitorId, options);
  }
};

