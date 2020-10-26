const got = require('got');

const bearerTokenURL = 'https://api.twitter.com/oauth2/token';

// make a request with apiKey and apiKeySecret to get a bearer token
const bearerToken = async (auth) => {
  const requestOptions = {
    form: {
      grant_type: 'client_credentials',

    },
    username: auth.apiKey,
    password: auth.apiKeySecret,
  };

  const { access_token: token } = await got.post(bearerTokenURL, requestOptions).json();

  return token;
};

/**
 * connect to the twitter stream, process the data
 *
 * @param options
 * @param streamHandler
 */
const streamConnect = async ({ streamUrl, ...auth }, streamHandler) => {
  let token;
  try {
    token = await bearerToken(auth);
  } catch (e) {
    // error occurred while trying to obtain bearer token
    console.warn(e);
  }

  const streamOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    searchParams: {
      'tweet.fields': 'entities',
    },
  };

  // connect and listen to the stream
  const connect = () => {
    const stream = got.stream(streamUrl, streamOptions).on('data', (data) => {
      let json;
      try {
        json = JSON.parse(data);
      } catch {
        // Keep alive signal received. Do nothing.
      }
      if (json) {
        streamHandler(json.data);
      }
    }).on('error', (error) => {
      console.warn(error);
      if (error.code === 'ETIMEDOUT') {
        stream.emit('timeout');
      }
    });

    return stream;
  };

  const stream = connect();

  let timeout = 0;
  stream.on('timeout', () => {
    console.warn('A connection error occurred. Reconnecting…');
    setTimeout(() => {
      timeout += 1;
      connect();
    }, 2 ** timeout);
  });
};

module.exports = {
  streamConnect,
};
