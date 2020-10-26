const config = {
  port: process.env.PORT ?? 8080,
  twitter: {
    apiKey: process.env.API_KEY,
    apiKeySecret: process.env.API_KEY_SECRET,
    streamUrl: process.env.STREAM_URL ?? 'https://api.twitter.com/2/tweets/sample/stream',
  },
  k: parseInt(process.env.K, 10) || 5,
};

module.exports = config;
