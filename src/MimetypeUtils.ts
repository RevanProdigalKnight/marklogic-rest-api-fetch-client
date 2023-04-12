const application = (subtype: string) => `application/${subtype}`;
const audio = (subtype: string) => `audio/${subtype}`;
const font = (subtype: string) => `font/${subtype}`;
const image = (subtype: string) => `image/${subtype}`;
const text = (subtype: string) => `text/${subtype}`;
const video = (subtype: string) => `video/${subtype}`;

const binaryData = application('octet-stream');

/**
 * Based on list of common mime types
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
 */
export const COMMON_MIMETYPES: Record<string, string> = {
  '3g2': video('3gpp2'),
  '3gp': video('3gpp'),
  '7z': application('x-7z-compressed'),
  aac: audio('aac'),
  abw: application('x-abiword'),
  apng: image('apng'),
  arc: application('x-freearc'),
  avi: video('x-msvideo'),
  avif: image('avif'),
  azw: application('vnd.amazon.ebook'),
  bin: binaryData,
  bmp: image('bmp'),
  bz2: application('x-bzip2'),
  bz: application('x-bzip'),
  cda: application('x-cdf'),
  csh: application('x-csh'),
  css: text('css'),
  csv: text('csv'),
  doc: application('msword'),
  docx: application('vnd.openxmlformats-officedocument.wordprocessingxml.document'),
  eot: application('vnd.ms-fontobject'),
  epub: application('epub+zip'),
  gif: image('gif'),
  gz: application('gzip'),
  htm: text('html'),
  html: text('html'),
  ico: image('vnd.microsoft.icon'),
  ics: text('calendar'),
  jar: application('java-archive'),
  jpeg: image('jpeg'),
  jpg: image('jpeg'),
  js: text('javascript'),
  json: application('json'),
  jsonld: application('ld+json'),
  mid: audio('midi'),
  midi: audio('midi'),
  mjs: text('javascript'),
  mp3: audio('mpeg'),
  mp4: video('mp4'),
  mpeg: audio('mpeg'),
  mpkg: application('vnd.apple.installer+xml'),
  odp: application('vnd.oasis.opendocument.presentation'),
  ods: application('vnd.oasis.opendocument.spreadsheet'),
  odt: application('vnd.oasis.opendocument.text'),
  oga: audio('ogg'),
  ogg: audio('ogg'),
  ogv: video('ogg'),
  ogx: application('ogg'),
  opus: audio('opus'),
  otf: font('otf'),
  php: application('x-httpd-php'),
  png: image('png'),
  ppt: application('vnd.ms-powerpoint'),
  pptx: application('vnd.openxmlformats-officedocument.presentationml.presentation'),
  rar: application('vnd.rar'),
  rtf: application('rtf'),
  sh: application('x-sh'),
  svg: image('svg+xml'),
  tar: application('x-tar'),
  tif: image('tiff'),
  tiff: image('tiff'),
  ts: video('mp2t'),
  ttf: font('ttf'),
  txt: text('plain'),
  vsd: application('vnd.visio'),
  wav: audio('wave'),
  weba: audio('webm'),
  webm: video('webm'),
  webp: image('webp'),
  woff2: font('woff2'),
  woff: font('woff'),
  xhtml: application('xhtml+xml'),
  xls: application('vnd.ms-excel'),
  xml: application('xml'),
  xslx: application('vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  xul: application('vnd.mozilla.xul+xml'),
  zip: application('zip'),
};

export function getMimetypeForFilename(filename: string) {
  const extension = filename.slice(filename.lastIndexOf('.') + 1);

  return COMMON_MIMETYPES[extension] ?? binaryData;
}
