/**
 * Stream handler for consuming a twitter stream with entities.
 *
 * Tracks:
 *  * Total tweets received
 *  * Tweets recieved a 1 second sliding window
 *  * Total tweets received in a 1 minute and 1 hour using a circular buffer hopping window
 *  * Top k emojis in tweets
 *  * Percentage of tweets containing emojis
 *  * Top k hashtags using count min sketch
 *  * Percentage of tweets containing a url
 *  * Percentage of tweets containing a photo url
 *  * Top k domains of urls in tweets using count min sketch
 */

const { get, curry, identity } = require('lodash');
const { TopK: TopKBloom } = require('bloom-filters');
const { SlidingWindow } = require('./slidingWindow');
const { CircularBuffer } = require('./circularBuffer');
const TopK = require('./topk');

const getData = (path, prop, func, data) => get(data, path, []).map((obj) => func(obj[prop]));
const getDomain = (url) => new URL(url).hostname;
const getHashtags = curry(getData)('entities.hashtags', 'tag', identity);
const getUrlDomains = curry(getData)('entities.urls', 'expanded_url', getDomain);

const photoUrl = 'pic.twitter.com';
const instaUrl = 'www.instagram.com';

class StreamHandler {
  constructor({ k }) {
    this.total = 0;
    this.tweetUrlCount = 0;
    this.tweetEmojiCount = 0;
    this.tweetPhotoCount = 0;
    this.perSecond = new SlidingWindow(1 * 1000);
    this.perMinute = new CircularBuffer(60);
    this.perHour = new CircularBuffer(60);
    // TopKBloom returns top k-1 values
    this.topKHashes = new TopKBloom(k + 1, 0.001, 0.99);
    this.topKEmojis = new TopK(k);
    this.topKDomains = new TopKBloom(k + 1, 0.001, 0.99);
    this.perMinuteInterval = null;
    this.perHourInterval = null;
  }

  process(data) {
    // count total, per second (sliding window),
    // per minute (hopping window), and per hour (hopping window)
    this.total += 1;
    this.perSecond.add();
    this.perMinuteInterval = this.perMinuteInterval ?? setInterval(() => {
      this.perMinute.add(this.perSecond.total());
    }, 1000);
    this.perHourInterval = this.perHourInterval ?? setInterval(() => {
      this.perHour.add(this.perMinute.total());
    }, 60 * 1000);

    // regex match Extended_Pictographic Unicode
    // increment counter and add to frequency map
    const emojis = get(data, 'text').match(/\p{Extended_Pictographic}/ug);
    if (emojis) {
      this.tweetEmojiCount += 1;
      emojis.forEach((emoji) => {
        this.topKEmojis.add(emoji);
      });
    }

    // add hashtags to frequency map
    const hashtags = getHashtags(data);
    hashtags.forEach((ht) => {
      this.topKHashes.add(ht);
    });

    // get hostname from urls, increment count
    // check for photo urls
    const domains = getUrlDomains(data);
    if (domains.length) {
      this.tweetUrlCount += 1;
      if (domains.includes(photoUrl) || domains.includes(instaUrl)) {
        this.tweetPhotoCount += 1;
      }
      domains.forEach((domain) => {
        this.topKDomains.add(domain);
      });
    }
  }

  // if compution leads to backpressure, consider using worker threads
  stats() {
    return {
      total: this.total,
      perSecond: this.perSecond.total(),
      perMinute: this.perMinute.total(),
      perHour: this.perHour.total(),
      topHashes: this.topKHashes.values(),
      topDomains: this.topKDomains.values(),
      topEmojis: this.topKEmojis.values(),
      tweetsWithEmojisPercentage: this.tweetEmojiCount / this.total,
      tweetsWithPhotosPercentage: this.tweetPhotoCount / this.total,
      tweetsWithUrlPercentage: this.tweetUrlCount / this.total,
    };
  }
}

module.exports = {
  StreamHandler,
};
