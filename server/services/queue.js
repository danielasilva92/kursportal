const visited = new Set();
const queue = [];

function normalizeQueueUrl(url = "") {
  return url.trim().replace(/\/+$/, "");
}

export function resetQueue() {
  visited.clear();
  queue.length = 0;
}

export function addToQueue(url) {
  if (!url) return;

  const normalized = normalizeQueueUrl(url);
  if (!normalized) return;

  if (visited.has(normalized)) return;
  if (queue.includes(normalized)) return;

  queue.push(normalized);
}

export function getNextUrl() {
  return queue.shift();
}

export function markVisited(url) {
  if (!url) return;
  visited.add(normalizeQueueUrl(url));
}

export function hasMoreUrls() {
  return queue.length > 0;
}

export function getQueueSize() {
  return queue.length;
}

export function getVisitedCount() {
  return visited.size;
}