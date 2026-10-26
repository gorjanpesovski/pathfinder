export function loadFlag(key, fallback){
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored === "1";
  } catch {
    return fallback;
  }
}

export function saveFlag(key, value){
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {}
}

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
