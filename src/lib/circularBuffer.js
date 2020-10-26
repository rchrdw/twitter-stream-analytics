/**
 *
 * @param size
 */
function CircularBuffer(size) {
  this.size = size;
  this.pointer = 0;
  this.buffer = [];

  this.add = (item) => {
    this.buffer[this.pointer] = item;
    this.pointer = (this.pointer + 1) % this.size;
  };

  this.total = () => this.buffer.reduce((acc, curr) => acc + curr, 0);
}

module.exports = {
  CircularBuffer,
};
