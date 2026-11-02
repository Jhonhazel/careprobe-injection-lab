// Exact fragment only. Its handler can update only the adjacent demonstration marker.
export const XSS_FRAGMENT = `<button onclick="this.nextElementSibling.textContent='XSS_MARKER'">Uji marker</button>`;
