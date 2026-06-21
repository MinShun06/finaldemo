// 按讚 / 反對紀錄：跨 tab/重開仍生效，與 DB 端 question_likes / question_dislikes 去重對齊
const LIKE_KEY = "nkust:liked";
const DISLIKE_KEY = "nkust:disliked";

function read(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function write(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage 不可用時靜默 (隱私模式等)
  }
}

export function hasLiked(id: string): boolean {
  return read(LIKE_KEY).has(id);
}

export function addLiked(id: string): void {
  const set = read(LIKE_KEY);
  set.add(id);
  write(LIKE_KEY, set);
}

export function hasDisliked(id: string): boolean {
  return read(DISLIKE_KEY).has(id);
}

export function addDisliked(id: string): void {
  const set = read(DISLIKE_KEY);
  set.add(id);
  write(DISLIKE_KEY, set);
}
