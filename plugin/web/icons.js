// Small line icons drawn for this card on a 16px grid. Stroke follows the text color.
const PATHS = {
  expand: '<path d="M9.5 2.5h4v4"/><path d="M13.5 2.5 9 7"/><path d="M6.5 13.5h-4v-4"/><path d="M2.5 13.5 7 9"/>',
  back: '<path d="M13 8H3.5"/><path d="M7 4.5 3.5 8 7 11.5"/>',
  chevron: '<path d="m4.5 6.25 3.5 3.5 3.5-3.5"/>',
  plus: '<path d="M8 3.25v9.5"/><path d="M3.25 8h9.5"/>',
  close: '<path d="m4.5 4.5 7 7"/><path d="m11.5 4.5-7 7"/>',
  open: '<path d="M5 11 11 5"/><path d="M5.75 5H11v5.25"/>',
  check: '<path d="m3.75 8.25 2.75 2.75 5.75-6.25"/>',
  alert: '<path d="M8 2.75 14 13.25H2L8 2.75Z"/><path d="M8 6.75v2.75"/><path d="M8 11.4v.1"/>',
  info: '<circle cx="8" cy="8" r="5.75"/><path d="M8 7.4v3.6"/><path d="M8 5.1v.1"/>',
  image: '<rect x="2.5" y="3" width="11" height="10" rx="2"/><circle cx="6" cy="6.5" r="1.1"/><path d="m3 12.25 3.25-3.25 2.25 2.25 1.75-1.75 2.75 2.75"/>',
  video: '<rect x="2.5" y="3.5" width="11" height="9" rx="2"/><path d="m7 6.25 2.75 1.75L7 9.75Z"/>',
  audio: '<path d="M3 7.25v1.5"/><path d="M5.5 5v6"/><path d="M8 3v10"/><path d="M10.5 5.5v5"/><path d="M13 7v2"/>',
  link: '<path d="m6.5 9.5 3-3"/><path d="m7.25 4.6 1.1-1.1a2.6 2.6 0 0 1 3.7 3.7l-1.1 1.1"/><path d="m8.75 11.4-1.1 1.1a2.6 2.6 0 0 1-3.7-3.7l1.1-1.1"/>',
  upload: '<path d="M8 10.5V3.25"/><path d="M5.25 6 8 3.25 10.75 6"/><path d="M3 10.5v1.25c0 .83.67 1.5 1.5 1.5h7c.83 0 1.5-.67 1.5-1.5V10.5"/>',
  file: '<path d="M9 2.5H5c-.83 0-1.5.67-1.5 1.5v8c0 .83.67 1.5 1.5 1.5h6c.83 0 1.5-.67 1.5-1.5V6L9 2.5Z"/><path d="M9 2.5V6h3.5"/>',
  play: '<path d="M5.5 3.9v8.2c0 .4.43.64.77.43l6.45-4.1a.5.5 0 0 0 0-.86L6.27 3.47a.5.5 0 0 0-.77.43Z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="4.5" y="3.5" width="2.5" height="9" rx=".75" fill="currentColor" stroke="none"/><rect x="9" y="3.5" width="2.5" height="9" rx=".75" fill="currentColor" stroke="none"/>',
  refresh: '<path d="M12.75 8a4.75 4.75 0 1 1-1.4-3.36"/><path d="M12.75 3v2.25H10.5"/>',
  sliders: '<path d="M3 5h5.5"/><path d="M11.5 5H13"/><path d="M3 11h1.5"/><path d="M7.5 11H13"/><circle cx="10" cy="5" r="1.5"/><circle cx="6" cy="11" r="1.5"/>',
};

export function icon(name, size = 16) {
  const paths = PATHS[name];
  if (!paths) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="icon icon-${name}" viewBox="0 0 16 16" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}
