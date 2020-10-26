const express = require('express');
const { port, twitter, k } = require('./config');
const { streamConnect } = require('./lib/twitter');
const { StreamHandler } = require('./lib/streamHandler');

const start = () => {
  const app = express();

  const streamHandler = new StreamHandler({ k });
  const handle = (data) => streamHandler.process(data);
  streamConnect(twitter, handle);

  app.get('/', (req, res) => {
    res.json(streamHandler.stats());
  });

  app.listen(port, () => console.log(`Listening on port ${port}`));
};

module.exports = {
  start,
};
