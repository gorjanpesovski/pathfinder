export function loadText(key, fallback){
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveText(key, value){
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function loadJson(key, fallback){
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : { ...fallback, ...JSON.parse(stored) };
  } catch {
    return fallback;
  }
}

export function saveJson(key, value){
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
