/**
 * Sliding window counting events occuring within an interval
 *
 * @param interval
 */
function SlidingWindow(interval) {
  this.interval = interval;
  this.window = [];

  this.add = () => {
    this.window.push(Date.now());
    this.pruneStale();
  };

  this.pruneStale = () => {
    while (Date.now() - this.window[0] > interval) {
      this.window.shift();
    }
  };

  this.total = () => {
    this.pruneStale();
    return this.window.length;
  };
}

module.exports = {
  SlidingWindow,
};
