// Remembers which clues and photos this browser has already been shown, so a site that comes up again shows something new.
const KEY = 'sampada-seen';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { clues: [], images: [] }; } catch { return { clues: [], images: [] }; } };
export const seenForServer = () => { const s = read(); return { seenClues: s.clues.slice(-600), seenImages: s.images.slice(-600) }; };
export function markSeen(clueId, image) {
  const s = read();
  if (clueId && !s.clues.includes(clueId)) s.clues.push(clueId);
  if (image && !s.images.includes(image)) s.images.push(image);
  try { localStorage.setItem(KEY, JSON.stringify({ clues: s.clues.slice(-600), images: s.images.slice(-600) })); } catch { /* storage blocked */ }
}
