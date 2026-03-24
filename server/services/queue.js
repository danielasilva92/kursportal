const visited = new Set();
const queue = [];

export function addToQueue(url) {
  if (!url || visited.has(url)) return;
  queue.push(url);
}

export function getNextUrl() {
  return queue.shift();
}

export function markVisited(url) {
  visited.add(url);
}

export function hasMoreUrls() {
  return queue.length > 0;
}