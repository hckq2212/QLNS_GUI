export default function pickName(input) {
  if (!input && input !== '') return null;
  // if already a string, return it (trimmed)
  if (typeof input === 'string') return input.trim() === '' ? null : input;
  // If it's an object, try common name fields
  if (typeof input === 'object') {
    return input.name || null;
  }
  return null;
}
