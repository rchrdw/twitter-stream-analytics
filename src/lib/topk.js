/**
 * Bucket sort a frequency map and returns the top k frequencies
 *
 * When then answer is not unique, i.e. the top k elements are not unique, all elements in the
 * bucket containing the kth frequent element will be returned, no additional ranking is considered
 *
 * @param map
 * @param k
 */
const bucketSort = (map, k) => {
  const buckets = [];

  for (const [key, value] of map) {
    if (!buckets[value]) buckets[value] = [];
    buckets[value].push(key);
  }

  const res = [];

  for (let i = map.size; i >= 0 && k > 0; i -= 1) {
    if (buckets[i]) {
      // eslint-disable-next-line no-param-reassign
      k -= buckets[i].length;
      buckets[i].forEach((item) => {
        res.push({ frequency: i, value: item });
      });
    }
  }
  return res;
};

/**
 * TopK returns the top k most frequent elements. It uses a hash map to map elements to their
 * frequencies in O(n) time.
 *
 * It uses bucket sort to calculate the top k elements in O(n) time.
 */
class TopK {
  constructor(k) {
    this.k = k;
    this.frequency = new Map();
  }

  add(item) {
    if (this.frequency.has(item)) {
      this.frequency.set(item, this.frequency.get(item) + 1);
    } else {
      this.frequency.set(item, 1);
    }
  }

  values() {
    return bucketSort(this.frequency, this.k);
  }
}

module.exports = TopK;
