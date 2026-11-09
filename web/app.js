'use strict';
/* Media Hub: app estática. Sin servidor propio y sin dependencias. */

const $ = (s, r = document) => r.querySelector(s);
const hub = window.hub || null; // API del .exe (Electron); null en la web
const IS_APP = !!hub;

/* ---------- utilidades ---------- */
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, '');
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
  return n;
};
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
};
const toast = (msg) => {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.id); toast.id = setTimeout(() => (t.hidden = true), 3500);
};
class NoKey extends Error { constructor(which) { super('Falta la clave de ' + which); this.which = which; } }
async function getJSON(url, headers) {
  const r = await fetch(url, headers ? { headers } : undefined);
  if (r.status === 401 || r.status === 403) throw new Error('HTTP ' + r.status + ' (clave no válida o sin permiso)');
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function getText(url) {
  if (IS_APP) return hub.fetchText(url);
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}
const decodeHTML = (s) => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };
const fmtDur = (s) => (s ? Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0') : '');
const loading = (msg = 'Cargando…') => el('div', { class: 'empty' }, el('span', { class: 'spin' }), msg);
const errBox = (msg, retry) => el('div', { class: 'err' }, msg, retry ? [' ', el('button', { class: 'btn ghost', onclick: retry }, 'Reintentar')] : null);

/* ---------- claves (.env en el .exe, Ajustes en la web) ---------- */
const KEYS = {
  TMDB_API_KEY: { label: 'TMDB (películas y series)', url: 'https://www.themoviedb.org/settings/api', hint: 'Gratis con cuenta. Sirve la «Clave de API» o el «Token de acceso de lectura».' },
  JAMENDO_CLIENT_ID: { label: 'Jamendo (música libre)', url: 'https://devportal.jamendo.com', hint: 'Gratis para uso no comercial. Es el «client_id» de tu aplicación.' }
};
let envCfg = {};
const keyOf = (name) => String((store.get('keys', {})[name] || envCfg[name] || '')).trim();
const keySource = (name) => (store.get('keys', {})[name] ? 'ajustes' : envCfg[name] ? '.env' : null);

/* ---------- secciones ---------- */
const VIEWS = {
  inicio:   { label: 'Inicio',             icon: '🏠' },
  cine:     { label: 'Películas y series', icon: '🎬', scope: true },
  clasico:  { label: 'Cine clásico libre', icon: '🎞️', scope: true },
  docs:     { label: 'Documentales',       icon: '🌍', scope: true },
  musica:   { label: 'Música',             icon: '🎵', scope: true },
  tv:       { label: 'TV en directo',      icon: '📡', scope: true },
  radio:    { label: 'Radio',              icon: '📻', scope: true },
  podcasts: { label: 'Podcasts',           icon: '🎙️', scope: true },
  libros:   { label: 'Audiolibros',        icon: '📚', scope: true },
  listas:   { label: 'Mis listas',         icon: '💿' },
  local:    { label: 'Mi biblioteca',      icon: '📁' },
  favs:     { label: 'Favoritos',          icon: '⭐' },
  enlaces:  { label: 'Plataformas',        icon: '📺' },
  ajustes:  { label: 'Ajustes',            icon: '⚙️' }
};

/* Catálogos del Internet Archive (dominio público y licencias abiertas) */
const IA = {
  clasico: { kind: 'video', title: 'Cine clásico libre', sub: 'Películas y series de dominio público que se reproducen aquí mismo', chips: [
    ['Películas', 'collection:feature_films'], ['Series clásicas', 'collection:classic_tv'],
    ['Animación', 'collection:animationandcartoons'], ['Cine mudo', 'collection:silent_films'] ] },
  docs: { kind: 'video', title: 'Documentales', sub: 'Documentales y películas educativas de acceso libre', chips: [
    ['Documentales', 'subject:documentary'], ['Archivo Prelinger', 'collection:prelinger'],
    ['Ciencia', 'subject:documentary AND subject:science'], ['Historia', 'subject:documentary AND subject:history'] ] },
  musica: { kind: 'audio', chips: [
    ['Netlabels (CC)', 'collection:netlabels'], ['Conciertos autorizados', 'collection:etree'],
    ['Música clásica', 'subject:"classical music"'], ['Jazz', 'subject:jazz AND collection:audio_music'] ] },
  libros: { kind: 'audio', title: 'Audiolibros', sub: 'LibriVox: libros leídos de dominio público', chips: [
    ['Todos', 'collection:librivoxaudio'], ['En español', 'collection:librivoxaudio AND language:Spanish'],
    ['Ficción', 'collection:librivoxaudio AND subject:fiction'], ['Poesía', 'collection:librivoxaudio AND subject:poetry'] ] }
};
const PODCAST_TOPICS = ['Actualidad', 'Historia', 'Ciencia', 'Tecnología', 'Humor', 'Cine', 'Música', 'Deportes'];
const RADIO_COUNTRIES = [['España', 'ES'], ['México', 'MX'], ['Argentina', 'AR'], ['Colombia', 'CO'], ['Reino Unido', 'GB'], ['EE. UU.', 'US']];

const PLATFORMS = [
  { n: 'RTVE Play', u: 'https://www.rtve.es/play/', d: 'La 1, La 2, Clan y Teledeporte en directo; series, documentales y cine español', t: ['directo', 'series', 'cine', 'docs'], l: ['es'] },
  { n: 'Atresplayer', u: 'https://www.atresplayer.com', d: 'Antena 3, laSexta y más en directo, y lo emitido recientemente', t: ['directo', 'series'], l: ['es'] },
  { n: 'Mediaset Infinity', u: 'https://www.mediasetinfinity.es', d: 'Canales del grupo, series y programas con anuncios', t: ['directo', 'series', 'cine'], l: ['es'] },
  { n: '3Cat', u: 'https://www.3cat.cat', d: 'TV3 y 324 en directo; series y documentales en catalán', t: ['directo', 'series', 'docs'], l: ['ca'] },
  { n: 'Pluto TV', u: 'https://pluto.tv/es', d: 'Más de 130 canales y cine a la carta, sin registro', t: ['directo', 'cine', 'series'], l: ['es', 'en'] },
  { n: 'Rakuten TV', u: 'https://rakuten.tv/es', d: 'Películas y canales gratis con anuncios', t: ['cine', 'series', 'directo'], l: ['es', 'en'] },
  { n: 'Plex', u: 'https://watch.plex.tv', d: 'Cine y series con anuncios; subtítulos en inglés', t: ['cine', 'series'], l: ['en', 'es'] },
  { n: 'Tubi', u: 'https://tubitv.com', d: 'Cine y series gratis (puede no estar disponible en España)', t: ['cine', 'series'], l: ['en'] },
  { n: 'Arte.tv', u: 'https://www.arte.tv/es/', d: 'Documentales, cine y cultura europea', t: ['docs', 'cine', 'series'], l: ['es', 'en', 'fr', 'de'] },
  { n: 'YouTube', u: 'https://www.youtube.com/feed/storefront', d: 'Películas gratis con anuncios y cine clásico', t: ['cine', 'series', 'docs'], l: ['es', 'en'] }
];
const MORE_LINKS = [
  ['Jamendo', 'https://www.jamendo.com', 'Música libre'],
  ['Free Music Archive', 'https://freemusicarchive.org', 'Música con licencias abiertas'],
  ['Bandcamp', 'https://bandcamp.com', 'Artistas independientes'],
  ['LibriVox', 'https://librivox.org', 'Audiolibros de dominio público'],
  ['Project Gutenberg', 'https://www.gutenberg.org', 'Libros gratuitos'],
  ['Wikimedia Commons', 'https://commons.wikimedia.org', 'Vídeo y audio libres']
];
const PROVIDER_URLS = [
  ['rtve', 'https://www.rtve.es/play/'], ['pluto', 'https://pluto.tv/es'], ['rakuten', 'https://rakuten.tv/es'], ['plex', 'https://watch.plex.tv'],
  ['atresplayer', 'https://www.atresplayer.com'], ['mediaset', 'https://www.mediasetinfinity.es'], ['youtube', 'https://www.youtube.com'],
  ['tubi', 'https://tubitv.com'], ['netflix', 'https://www.netflix.com'], ['prime video', 'https://www.primevideo.com'], ['disney', 'https://www.disneyplus.com'],
  ['movistar', 'https://ver.movistarplus.es'], ['filmin', 'https://www.filmin.es'], ['apple tv', 'https://tv.apple.com'], ['skyshowtime', 'https://www.skyshowtime.com']
];

/* ---------- estado ---------- */
const state = {
  q: store.get('q', {}), chip: store.get('chip', {}),
  favs: store.get('favs', []), recent: store.get('recent', []), lists: store.get('lists', {}),
  cine: Object.assign({ type: 'movie', lang: '', free: true }, store.get('cine', {})),
  tv: Object.assign({ country: 'ES', cat: '' }, store.get('tv', {})),
  local: []
};
const saveState = () => { store.set('q', state.q); store.set('chip', state.chip); store.set('cine', state.cine); store.set('tv', state.tv); };
const isFav = (it) => state.favs.some((f) => f.id === it.id);
const serial = (it) => ({ id: it.id, title: it.title, sub: it.sub, thumb: it.thumb, kind: it.kind, ia: it.ia, src: it.src, feed: it.feed, page: it.page, mt: it.mt, tid: it.tid, ytid: it.ytid, dur: it.dur, chid: it.chid });
function toggleFav(it) {
  if (isFav(it)) state.favs = state.favs.filter((f) => f.id !== it.id);
  else state.favs.unshift(serial(it));
  store.set('favs', state.favs);
}
function addRecent(it) {
  if (!it.id || it.id.startsWith('local:')) return;
  state.recent = [serial(it), ...state.recent.filter((r) => r.id !== it.id)].slice(0, 12);
  store.set('recent', state.recent);
}

/* ---------- reproductor ---------- */
const audio = $('#audio');
const video = $('#video');
const dlg = $('#videoDlg');
const ytBox = $('#yt');
const ytFrame = $('#ytFrame');
let queue = [], qi = 0, blobUrl = null;

async function srcOf(it) {
  if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
  if (it.handle) return (blobUrl = URL.createObjectURL(await it.handle.getFile()));
  if (it.file) return (blobUrl = URL.createObjectURL(it.file));
  return it.src;
}
function stopYT() { ytFrame.removeAttribute('src'); ytBox.hidden = true; }
function playYT(it) {
  audio.pause();
  $('#ytTitle').textContent = it.title;
  const origin = /^https?:$/.test(location.protocol) ? '&origin=' + encodeURIComponent(location.origin) : '';
  ytFrame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(it.ytid)}?autoplay=1&rel=0&enablejsapi=1${origin}`;
  ytBox.hidden = false;
}
ytFrame.addEventListener('load', () => {
  try { ytFrame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch { /* sin acceso */ }
});
window.addEventListener('message', (e) => {
  if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
  let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
  const ended = (d?.event === 'onStateChange' && d.info === 0) || (d?.event === 'infoDelivery' && d.info?.playerState === 0);
  if (ended && queue[qi]?.kind === 'yt' && qi < queue.length - 1) playAudio(queue, qi + 1);
});
$('#ytClose').onclick = stopYT;

async function playAudio(list, i = 0) {
  queue = list; qi = i;
  const it = queue[qi];
  $('#pTitle').textContent = it.title;
  $('#pSub').textContent = it.sub || '';
  $('#player').hidden = false;
  addRecent(it);
  if (it.kind === 'yt') { audio.hidden = true; return playYT(it); }
  audio.hidden = false; stopYT();
  try { audio.src = await srcOf(it); } catch { return toast('No se pudo abrir el archivo'); }
  audio.play().catch(() => {});
}
audio.addEventListener('ended', () => { if (qi < queue.length - 1) playAudio(queue, qi + 1); });
audio.addEventListener('error', () => { if (audio.getAttribute('src')) toast('No se pudo reproducir este audio'); });
$('#pPrev').onclick = () => { if (qi > 0) playAudio(queue, qi - 1); };
$('#pNext').onclick = () => { if (qi < queue.length - 1) playAudio(queue, qi + 1); };
$('#pClose').onclick = () => { audio.pause(); audio.removeAttribute('src'); audio.load(); stopYT(); $('#player').hidden = true; };

function showQueue() {
  const body = $('#qBody');
  body.replaceChildren(el('div', { class: 'pad' }, el('h2', {}, 'Cola de reproducción'),
    queue.length ? queue.slice(0, 300).map((it, i) => el('button', { class: 'qrow' + (i === qi ? ' now' : ''), onclick: () => { $('#queueDlg').close(); playAudio(queue, i); } },
      el('span', {}, i === qi ? '▶' : String(i + 1)), el('span', {}, it.title))) : el('p', { class: 'sub' }, 'La cola está vacía.')));
  $('#queueDlg').showModal();
}
$('#pInfo').onclick = showQueue;

async function playVideo(it) {
  const msg = $('#vMsg'); msg.hidden = true; msg.textContent = '';
  $('#vTitle').textContent = it.title;
  try { video.src = await srcOf(it); } catch { return toast('No se pudo abrir el archivo'); }
  video.onerror = () => {
    msg.hidden = false;
    msg.textContent = 'Este vídeo no se puede reproducir aquí (formato no compatible).';
    msg.append(' ');
    if (it.path && IS_APP) msg.append(el('a', { href: '#', onclick: (e) => { e.preventDefault(); hub.openPath(it.path); } }, 'Abrir con el reproductor del sistema'));
    else if (it.page) msg.append(el('a', { href: it.page, target: '_blank', rel: 'noopener' }, 'Abrir en la web original'));
  };
  audio.pause();
  dlg.showModal();
  video.play().catch(() => {});
  addRecent(it);
}
dlg.addEventListener('close', () => { stopHls(); video.pause(); video.removeAttribute('src'); video.load(); });

/* Directos (HLS) con hls.js */
let hls = null;
function stopHls() { if (hls) { hls.destroy(); hls = null; } }
function playLive(title, streams, i = 0) {
  const msg = $('#vMsg');
  msg.hidden = true; msg.textContent = '';
  $('#vTitle').textContent = title;
  audio.pause();
  stopHls();
  video.onerror = null;
  const s = streams[i];
  const next = () => {
    if (i + 1 < streams.length) { toast('Probando otra emisión del canal…'); return playLive(title, streams, i + 1); }
    msg.hidden = false;
    msg.textContent = 'Este canal no está disponible ahora mismo (emisión caída, bloqueada en tu país o sin permiso de reproducción en el navegador).';
  };
  if (!dlg.open) dlg.showModal();
  const isHls = /\.m3u8?(\?|#|$)/i.test(s.url) || !/\.(mp4|webm|ogv|mp3|aac)(\?|#|$)/i.test(s.url);
  if (isHls && window.Hls && Hls.isSupported()) {
    hls = new Hls({ enableWorker: true, lowLatencyMode: false, manifestLoadingMaxRetry: 1, levelLoadingMaxRetry: 1, fragLoadingMaxRetry: 2 });
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) { stopHls(); next(); } });
    hls.loadSource(s.url);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHls) {
    video.src = s.url;
    video.onerror = next;
    video.play().catch(() => {});
  } else next();
}
$('#vClose').onclick = () => dlg.close();
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
for (const [d, b] of [['#detailDlg', '#dClose'], ['#listDlg', '#lClose'], ['#queueDlg', '#qClose']]) {
  $(b).onclick = () => $(d).close();
  $(d).addEventListener('click', (e) => { if (e.target === $(d)) $(d).close(); });
}
$('#detailDlg').addEventListener('close', () => { $('#dBody').replaceChildren(); }); // detiene tráilers

/* ---------- abrir elementos ---------- */
const IA_VIDEO_RE = [/\.mp4$/i, /\.webm$/i, /\.ogv$/i, /\.m4v$/i];
const IA_AUDIO_RE = [/\.mp3$/i, /\.ogg$/i, /\.m4a$/i, /\.flac$/i];
async function resolveIA(it) {
  const m = await getJSON('https://archive.org/metadata/' + encodeURIComponent(it.ia));
  const files = (m.files || []).filter((f) => f.source !== 'metadata' && !/_spectrogram|_thumb/i.test(f.name));
  const url = (f) => 'https://archive.org/download/' + encodeURIComponent(it.ia) + '/' + f.name.split('/').map(encodeURIComponent).join('/');
  const page = 'https://archive.org/details/' + encodeURIComponent(it.ia);
  if (it.kind === 'video') {
    for (const re of IA_VIDEO_RE) { const f = files.find((x) => re.test(x.name)); if (f) return [{ ...it, src: url(f), page }]; }
  } else {
    for (const re of IA_AUDIO_RE) {
      const fs = files.filter((x) => re.test(x.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      if (fs.length) return fs.map((f) => ({ ...it, id: it.id + '#' + f.name, title: f.title || f.name.replace(/\.[^.]+$/, ''), sub: it.title, src: url(f), page }));
    }
  }
  throw new Error('Sin archivo reproducible');
}
async function openItem(it) {
  try {
    if (it.kind === 'podcast') return showEpisodes(it);
    if (it.kind === 'tmdb') return showDetail(it);
    if (it.kind === 'tv') {
      const ch = (await loadTV()).byId.get(it.chid);
      if (!ch) return toast('Este canal ya no está en el catálogo');
      return playLive(ch.name, ch.streams);
    }
    if (it.ia) {
      toast('Preparando…');
      const list = await resolveIA(it);
      return it.kind === 'video' ? playVideo(list[0]) : playAudio(list, 0);
    }
    return it.kind === 'video' ? playVideo(it) : playAudio([it], 0);
  } catch (e) { toast('No se pudo abrir: ' + e.message); }
}

/* ---------- componentes ---------- */
const icoOf = (it) => (it.kind === 'video' || it.kind === 'tmdb' ? '🎬' : it.kind === 'podcast' ? '🎙️' : '🎵');
function setThumb(node, it) {
  if (!it.thumb) { node.textContent = icoOf(it); return; }
  const probe = new Image();
  probe.referrerPolicy = 'no-referrer';
  probe.onload = () => { node.style.backgroundImage = `url("${it.thumb.replace(/"/g, '%22')}")`; node.textContent = ''; };
  probe.onerror = () => (node.textContent = icoOf(it));
  probe.src = it.thumb;
}
function card(it, opts = {}) {
  const img = el('div', { class: 'img' + (it.kind === 'tmdb' ? ' poster' : '') });
  setThumb(img, it);
  const fav = el('button', { class: 'fav' + (isFav(it) ? ' on' : ''), title: 'Favorito', 'aria-label': 'Marcar como favorito', onclick: (e) => {
    e.stopPropagation(); toggleFav(it); fav.classList.toggle('on', isFav(it)); fav.textContent = isFav(it) ? '★' : '☆';
    if (opts.onFav) opts.onFav();
  } }, isFav(it) ? '★' : '☆');
  return el('div', { class: 'card' + (it.kind === 'video' ? ' wide' : ''), role: 'button', tabindex: '0',
    onclick: () => openItem(it), onkeydown: (e) => { if (e.key === 'Enter') openItem(it); } },
    img, fav, el('div', { class: 'meta' }, el('div', { class: 't' }, it.title), el('div', { class: 's' }, it.sub || '')));
}
const grid = (items, opts) => el('div', { class: 'grid' }, items.map((i) => card(i, opts)));
function chips(list, active, onPick) {
  return el('div', { class: 'chips' }, list.map((c, i) => el('button', { class: 'chip' + (i === active ? ' on' : ''), onclick: () => onPick(i) }, Array.isArray(c) ? c[0] : c)));
}
const head = (title, sub) => [el('h1', {}, title), sub ? el('p', { class: 'sub' }, sub) : null];

/* filas de pistas (estilo Spotify) */
function trackRows(items) {
  return el('div', { class: 'list' }, items.map((it, i) => {
    const cover = el('div', { class: 'img', style: 'width:44px;height:44px;border-radius:8px;flex:none;background:var(--panel2) center/cover;display:grid;place-items:center' });
    setThumb(cover, it);
    return el('div', { class: 'row', role: 'button', tabindex: '0', onclick: () => playAudio(items, i), onkeydown: (e) => { if (e.key === 'Enter') playAudio(items, i); } },
      cover, el('span', { class: 'tx' }, el('b', {}, it.title), el('small', {}, it.sub || '')),
      el('small', {}, fmtDur(it.dur)),
      el('button', { class: 'add', title: 'Añadir a una lista', 'aria-label': 'Añadir a una lista', onclick: (e) => { e.stopPropagation(); addToList(it); } }, '＋'));
  }));
}

/* listas de reproducción */
function addToList(it) {
  const body = $('#lBody');
  const done = (name) => {
    const l = state.lists[name] = state.lists[name] || [];
    if (!l.some((x) => x.id === it.id)) l.push(serial(it));
    store.set('lists', state.lists); $('#listDlg').close(); toast(`Añadida a «${name}»`);
  };
  const input = el('input', { type: 'text', placeholder: 'Nueva lista…', maxlength: '60' });
  body.replaceChildren(el('div', { class: 'pad' }, el('h2', {}, 'Añadir a una lista'),
    Object.keys(state.lists).map((n) => el('button', { class: 'qrow', onclick: () => done(n) }, '💿 ' + n + ` (${state.lists[n].length})`)),
    el('form', { class: 'inline', onsubmit: (e) => { e.preventDefault(); const n = input.value.trim(); if (n) done(n); } }, input, el('button', { class: 'btn', type: 'submit' }, 'Crear'))));
  $('#listDlg').showModal();
}

/* ---------- vistas ---------- */
const view = $('#view');
const mount = (...nodes) => { view.replaceChildren(...nodes.flat(Infinity).filter(Boolean)); };

function vInicio() {
  const tiles = Object.entries(VIEWS).filter(([k]) => k !== 'inicio').map(([k, v]) =>
    el('a', { class: 'tile', href: '#' + k }, el('span', { class: 'ic' }, v.icon), el('b', {}, v.label)));
  const freeRow = el('div', {});
  mount(
    el('div', { class: 'hero' }, el('h1', {}, 'Tu centro de entretenimiento'),
      el('p', { class: 'sub' }, 'Películas, series, documentales, música, radio, podcasts y audiolibros. Gratis, legal y en un solo sitio.'),
      el('div', { class: 'tiles' }, tiles)),
    freeRow,
    state.recent.length ? [el('h2', {}, 'Seguir explorando'), grid(state.recent)] : null
  );
  if (keyOf('TMDB_API_KEY')) {
    tmdb('/discover/movie', { watch_region: 'ES', with_watch_monetization_types: 'free|ads', sort_by: 'popularity.desc' }).then((d) => {
      freeRow.replaceChildren(el('h2', {}, 'Gratis ahora en España'), grid(d.results.slice(0, 12).map((m) => tmdbItem(m, 'movie'))));
    }).catch(() => {});
  } else {
    freeRow.replaceChildren(el('div', { class: 'empty', style: 'margin-top:18px' }, 'Activa el catálogo de cine y series en ', el('a', { href: '#ajustes' }, 'Ajustes'), ' (clave gratuita de TMDB).'));
  }
}

/* --- Internet Archive --- */
function iaBlock(key, chipKey, rerender) {
  const cfg = IA[key];
  const ci = Math.min(state.chip[chipKey] ?? 0, cfg.chips.length - 1);
  const q = state.q[key] || '';
  const out = el('div', {}, loading());
  const node = el('div', {},
    chips(cfg.chips, ci, (i) => { state.chip[chipKey] = i; state.q[key] = ''; saveState(); rerender(); }),
    q ? el('p', { class: 'sub' }, `Resultados para «${q}»`) : null, out);
  (async () => {
    try {
      const term = q.replace(/["\\]/g, ' ').trim();
      const query = `mediatype:${cfg.kind === 'video' ? 'movies' : 'audio'} AND (${cfg.chips[ci][1]})` + (term ? ` AND (${term})` : '');
      const p = new URLSearchParams({ q: query, rows: '40', output: 'json' });
      if (!term) p.set('sort', 'downloads desc');
      ['identifier', 'title', 'year', 'creator'].forEach((f) => p.append('fl[]', f));
      const data = await getJSON('https://archive.org/advancedsearch.php?' + p);
      const docs = data.response?.docs || [];
      if (!docs.length) return out.replaceChildren(el('div', { class: 'empty' }, 'Sin resultados. Prueba con otra búsqueda.'));
      out.replaceChildren(grid(docs.map((d) => ({
        id: 'ia:' + d.identifier, ia: d.identifier, kind: cfg.kind,
        title: Array.isArray(d.title) ? d.title[0] : d.title || d.identifier,
        sub: [d.year, Array.isArray(d.creator) ? d.creator[0] : d.creator].filter(Boolean).join(' · '),
        thumb: 'https://archive.org/services/img/' + encodeURIComponent(d.identifier)
      }))));
    } catch (e) { out.replaceChildren(errBox('No se pudo cargar el catálogo (' + e.message + ').', rerender)); }
  })();
  return node;
}
const vIAFull = (key) => mount(head(IA[key].title, IA[key].sub), iaBlock(key, key, route));

/* --- TMDB: películas y series --- */
const GENRES = [
  ['Populares', {}, {}],
  ['Mejor valoradas', { sort_by: 'vote_average.desc', 'vote_count.gte': '300' }, { sort_by: 'vote_average.desc', 'vote_count.gte': '300' }],
  ['Comedia', { with_genres: '35' }, { with_genres: '35' }],
  ['Drama', { with_genres: '18' }, { with_genres: '18' }],
  ['Acción', { with_genres: '28' }, { with_genres: '10759' }],
  ['Terror y misterio', { with_genres: '27' }, { with_genres: '9648' }],
  ['Ciencia ficción', { with_genres: '878' }, { with_genres: '10765' }],
  ['Animación', { with_genres: '16' }, { with_genres: '16' }],
  ['Familia', { with_genres: '10751' }, { with_genres: '10751' }],
  ['Documental', { with_genres: '99' }, { with_genres: '99' }]
];
const LANGS = [['', 'Cualquier idioma'], ['es', 'Español'], ['en', 'Inglés'], ['fr', 'Francés'], ['de', 'Alemán'], ['it', 'Italiano'], ['ca', 'Catalán'], ['ja', 'Japonés'], ['ko', 'Coreano']];

async function tmdb(path, params = {}) {
  const key = keyOf('TMDB_API_KEY');
  if (!key) throw new NoKey('TMDB');
  const p = new URLSearchParams({ language: 'es-ES', ...params });
  const headers = {};
  if (key.length > 40) headers.Authorization = 'Bearer ' + key; else p.set('api_key', key);
  return getJSON('https://api.themoviedb.org/3' + path + '?' + p, headers);
}
const IMG = 'https://image.tmdb.org/t/p/';
function tmdbItem(m, mt) {
  const date = m.release_date || m.first_air_date || '';
  return {
    id: `tmdb:${mt}:${m.id}`, kind: 'tmdb', mt, tid: m.id, title: m.title || m.name || '?',
    sub: [date.slice(0, 4), m.vote_average ? '★ ' + m.vote_average.toFixed(1) : ''].filter(Boolean).join(' · '),
    thumb: m.poster_path ? IMG + 'w342' + m.poster_path : ''
  };
}
const setupCard = (which) => el('div', { class: 'empty setup' }, el('h2', {}, 'Falta la clave de ' + which),
  el('p', {}, 'Es gratuita. Créala, pégala en ', el('a', { href: '#ajustes' }, 'Ajustes'), IS_APP ? ' o ponla en el archivo .env.' : '.'));
function tmdbAttribution() {
  return el('p', { class: 'attrib' }, 'Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB. Datos de disponibilidad: JustWatch.');
}

async function vCine() {
  const c = state.cine, q = state.q.cine || '';
  const out = el('div', {}, loading());
  let page = 1;
  const rerender = () => { saveState(); route(); };
  const typeBtns = el('div', { class: 'chips' },
    [['movie', 'Películas'], ['tv', 'Series']].map(([v, l]) => el('button', { class: 'chip' + (c.type === v ? ' on' : ''), onclick: () => { c.type = v; rerender(); } }, l)));
  const langSel = el('select', { 'aria-label': 'Idioma original', onchange: (e) => { c.lang = e.target.value; rerender(); } },
    LANGS.map(([v, l]) => el('option', { value: v, selected: v === c.lang }, l)));
  const freeChk = el('label', { class: 'chip' + (c.free ? ' on' : ''), style: 'cursor:pointer' },
    el('input', { type: 'checkbox', checked: c.free, style: 'display:none', onchange: (e) => { c.free = e.target.checked; rerender(); } }), '✔ Solo gratis en España');
  const gi = Math.min(state.chip.cine ?? 0, GENRES.length - 1);
  mount(head('Películas y series', 'Catálogo con carátulas. Cada título te dice dónde verlo legalmente en España.'),
    typeBtns,
    q ? el('div', { class: 'bar' }, el('span', { class: 'sub' }, `Resultados para «${q}»`), el('button', { class: 'btn ghost', onclick: () => { state.q.cine = ''; rerender(); } }, 'Quitar búsqueda'))
      : [el('div', { class: 'bar' }, langSel, freeChk), chips(GENRES, gi, (i) => { state.chip.cine = i; rerender(); })],
    out, tmdbAttribution());
  if (!keyOf('TMDB_API_KEY')) {
    out.replaceChildren(setupCard('TMDB'), el('p', { class: 'sub' }, 'Mientras tanto tienes el ', el('a', { href: '#clasico' }, 'cine clásico libre'), ' y las ', el('a', { href: '#enlaces' }, 'plataformas gratuitas'), '.'));
    return;
  }
  const more = el('button', { class: 'btn ghost', onclick: () => { page++; load(); } }, 'Cargar más');
  const results = el('div', {});
  async function load() {
    try {
      let d;
      if (q) d = await tmdb('/search/' + c.type, { query: q, page: String(page), include_adult: 'false' });
      else {
        const params = { page: String(page), sort_by: 'popularity.desc', watch_region: 'ES', include_adult: 'false', ...GENRES[gi][c.type === 'movie' ? 1 : 2] };
        if (c.free) params.with_watch_monetization_types = 'free|ads';
        if (c.lang) params.with_original_language = c.lang;
        d = await tmdb('/discover/' + c.type, params);
      }
      const items = (d.results || []).map((m) => tmdbItem(m, c.type));
      if (page === 1 && !items.length) return out.replaceChildren(el('div', { class: 'empty' }, 'Sin resultados con estos filtros. Prueba a quitar «solo gratis» o el idioma.'));
      results.append(grid(items));
      if (page === 1) out.replaceChildren(results, el('p', {}, more));
      more.hidden = page >= (d.total_pages || 1);
    } catch (e) { out.replaceChildren(errBox(e instanceof NoKey ? 'Falta la clave de TMDB.' : 'No se pudo cargar el catálogo (' + e.message + ').', route)); }
  }
  load();
}

async function showDetail(it) {
  const body = $('#dBody');
  body.replaceChildren(el('div', { class: 'pad' }, loading()));
  $('#detailDlg').showModal();
  try {
    const d = await tmdb(`/${it.mt}/${it.tid}`, { append_to_response: 'watch/providers,videos', include_video_language: 'es,en,null' });
    const reg = d['watch/providers']?.results?.ES || {};
    const provLink = (p) => (PROVIDER_URLS.find(([k]) => p.provider_name.toLowerCase().includes(k)) || [])[1] || reg.link;
    const group = (title, list, free) => (list?.length ? [el('div', {}, el('span', { class: 'badge' + (free ? ' free' : '') }, title)),
      el('div', { class: 'prov' }, list.map((p) => el('a', { href: provLink(p), target: '_blank', rel: 'noopener noreferrer' },
        p.logo_path ? el('img', { src: IMG + 'w92' + p.logo_path, alt: '', loading: 'lazy' }) : null, p.provider_name)))] : []);
    const free = [...(reg.free || []), ...(reg.ads || [])];
    const noProv = !free.length && !reg.flatrate?.length && !reg.rent?.length && !reg.buy?.length;
    const trailer = (d.videos?.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer') || (d.videos?.results || []).find((v) => v.site === 'YouTube');
    const trailerBox = el('div', {});
    const meta = [(d.release_date || d.first_air_date || '').slice(0, 4), d.runtime ? d.runtime + ' min' : d.number_of_seasons ? d.number_of_seasons + ' temporadas' : '',
      d.vote_average ? '★ ' + d.vote_average.toFixed(1) : ''].filter(Boolean).join(' · ');
    const poster = el('div', { class: 'poster' });
    if (d.poster_path) poster.style.backgroundImage = `url("${IMG}w500${d.poster_path}")`;
    body.replaceChildren(el('div', { class: 'detail' }, poster, el('div', {},
      el('h2', {}, d.title || d.name), el('p', { class: 'meta-line' }, meta),
      el('div', {}, (d.genres || []).map((g) => el('span', { class: 'badge' }, g.name)),
        (d.spoken_languages || []).slice(0, 4).map((l) => el('span', { class: 'badge' }, '🗣 ' + (l.name || l.english_name)))),
      el('p', {}, d.overview || 'Sin sinopsis en español.'),
      el('h3', {}, 'Dónde verla en España'),
      group('Gratis (con anuncios)', free, true), group('Suscripción', reg.flatrate), group('Alquiler', reg.rent), group('Compra', reg.buy),
      noProv ? el('p', { class: 'sub' }, 'No consta en ninguna plataforma en España ahora mismo.') : null,
      reg.link ? el('p', {}, el('a', { href: reg.link, target: '_blank', rel: 'noopener noreferrer' }, 'Ver todas las opciones (JustWatch)')) : null,
      trailer ? el('p', {}, el('button', { class: 'btn', onclick: (e) => {
        e.target.hidden = true;
        const origin = /^https?:$/.test(location.protocol) ? '&origin=' + encodeURIComponent(location.origin) : '';
        trailerBox.replaceChildren(el('iframe', { class: 'trailer', title: 'Tráiler', allow: 'autoplay; encrypted-media; fullscreen', allowfullscreen: true,
          src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1&rel=0${origin}` }));
      } }, '▶ Ver tráiler')) : null, trailerBox,
      el('button', { class: 'btn ghost', onclick: () => { toggleFav(it); toast(isFav(it) ? 'Añadido a favoritos' : 'Quitado de favoritos'); } }, '☆ Favorito'),
      tmdbAttribution())));
  } catch (e) { body.replaceChildren(el('div', { class: 'pad' }, errBox('No se pudo cargar la ficha (' + e.message + ').'))); }
}

/* --- Música --- */
const MUSIC_SRC = ['Audius', 'Jamendo', 'YouTube', 'Internet Archive'];
let audiusBase = 'https://api.audius.co';
async function audius(path, params = {}) {
  const p = new URLSearchParams({ app_name: 'MediaHub', ...params });
  const go = async () => { const r = await fetch(`${audiusBase}/v1${path}?${p}`); if (!r.ok) throw new Error('HTTP ' + r.status); return (await r.json()).data; };
  try { return await go(); } catch (e) {
    const hosts = (await getJSON('https://api.audius.co')).data || [];
    if (!hosts.length) throw e;
    audiusBase = hosts[Math.floor(Math.random() * hosts.length)];
    return go();
  }
}
async function musicAudius(q) {
  const data = q ? await audius('/tracks/search', { query: q, limit: '40' }) : await audius('/tracks/trending', { time: 'week', limit: '40' });
  return data.map((t) => ({ id: 'audius:' + t.id, kind: 'audio', title: t.title, sub: t.user?.name || '', dur: t.duration,
    thumb: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '', src: `${audiusBase}/v1/tracks/${t.id}/stream?app_name=MediaHub` }));
}
async function musicJamendo(q) {
  const key = keyOf('JAMENDO_CLIENT_ID');
  if (!key) throw new NoKey('Jamendo');
  const p = new URLSearchParams({ client_id: key, format: 'json', limit: '40', audioformat: 'mp32', order: 'popularity_week' });
  if (q) { p.set('search', q); p.set('order', 'relevance'); }
  const d = await getJSON('https://api.jamendo.com/v3.0/tracks/?' + p);
  if (d.headers?.status === 'failed') throw new Error(d.headers.error_message || 'Jamendo rechazó la petición');
  return (d.results || []).filter((t) => t.audio).map((t) => ({ id: 'jamendo:' + t.id, kind: 'audio', title: t.name, sub: t.artist_name + (t.album_name ? ' · ' + t.album_name : ''),
    dur: t.duration, thumb: t.image, src: t.audio }));
}
const musicYouTube = async () => null; // YouTube: solo enlaces pegados (sin clave)
function ytIdFrom(text) {
  const t = String(text).trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  try {
    const u = new URL(t);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1, 12);
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      if (u.searchParams.get('v')) return u.searchParams.get('v').slice(0, 11);
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch { /* no es una URL */ }
  return null;
}
function ytPasteForm() {
  const input = el('input', { type: 'text', placeholder: 'Pega un enlace de YouTube o YouTube Music…', 'aria-label': 'Enlace de YouTube' });
  return el('div', {}, el('form', { class: 'inline', style: 'max-width:640px;margin:0 0 6px', onsubmit: async (e) => {
    e.preventDefault();
    const id = ytIdFrom(input.value);
    if (!id) return toast('Ese enlace no parece de YouTube');
    let title = 'Vídeo de YouTube', sub = 'Enlace pegado';
    try { const o = await getJSON('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id)); title = o.title || title; sub = o.author_name || sub; } catch { /* título genérico */ }
    playAudio([{ id: 'yt:' + id, kind: 'yt', ytid: id, title, sub, thumb: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` }], 0);
    input.value = '';
  } }, input, el('button', { class: 'btn', type: 'submit' }, '▶ Reproducir')),
  el('p', { class: 'sub' }, 'Se reproduce en el reproductor oficial de YouTube (se ve el vídeo en una ventana pequeña).'));
}
function vMusica() {
  const si = Math.min(state.chip.musica ?? 0, MUSIC_SRC.length - 1);
  const q = state.q.musica || '';
  const out = el('div', {}, loading());
  mount(head('Música', 'Audius, Jamendo, YouTube y archivo libre: busca, crea listas y reproduce.'),
    chips(MUSIC_SRC, si, (i) => { state.chip.musica = i; saveState(); route(); }),
    si === 2 ? ytPasteForm() : null,
    q && si !== 3 ? el('p', { class: 'sub' }, `Resultados para «${q}»`) : null, out);
  if (si === 3) return out.replaceChildren(iaBlock('musica', 'musicaIA', route));
  (async () => {
    try {
      const items = await [musicAudius, musicJamendo, musicYouTube][si](q);
      if (items === null) return out.replaceChildren(el('div', { class: 'empty' }, si === 2
        ? 'Pega un enlace de YouTube arriba y se reproduce con su reproductor oficial. No necesita clave.'
        : 'Escribe arriba qué quieres escuchar y pulsa Buscar.'));
      out.replaceChildren(items.length ? el('div', {}, el('p', {}, el('button', { class: 'btn', onclick: () => playAudio(items, 0) }, '▶ Reproducir todo')), trackRows(items)) : el('div', { class: 'empty' }, 'Sin resultados.'));
    } catch (e) {
      out.replaceChildren(e instanceof NoKey ? setupCard(e.which) : errBox('No se pudo cargar (' + e.message + ').', route));
    }
  })();
}

function vListas() {
  const names = Object.keys(state.lists);
  mount(head('Mis listas', 'Crea listas desde el botón ＋ de cualquier canción.'),
    names.length ? names.map((n) => {
      const items = state.lists[n];
      return el('div', {}, el('div', { class: 'bar' }, el('h2', { style: 'margin:0' }, '💿 ' + n),
        el('button', { class: 'btn', onclick: () => items.length && playAudio(items, 0) }, '▶ Reproducir'),
        el('button', { class: 'btn ghost', onclick: () => { delete state.lists[n]; store.set('lists', state.lists); route(); } }, 'Borrar lista')),
        items.length ? trackRows(items) : el('div', { class: 'empty' }, 'Lista vacía.'));
    }) : el('div', { class: 'empty' }, 'Todavía no tienes listas. Pulsa ＋ junto a una canción en Música.'));
}

/* --- TV en directo (catálogo abierto iptv-org) --- */
const IPTV_API = 'https://iptv-org.github.io/api/';
const TV_CATS = { news: 'Noticias', sports: 'Deportes', general: 'General', documentary: 'Documentales', kids: 'Infantil', movies: 'Cine', music: 'Música',
  entertainment: 'Entretenimiento', series: 'Series', culture: 'Cultura', education: 'Educación', religious: 'Religión', science: 'Ciencia', lifestyle: 'Estilo de vida',
  business: 'Economía', comedy: 'Comedia', cooking: 'Cocina', travel: 'Viajes', weather: 'El tiempo', family: 'Familia', animation: 'Animación', auto: 'Motor',
  outdoor: 'Aire libre', relax: 'Relax', shop: 'Compras', interactive: 'Interactivo', public: 'Público', legislative: 'Parlamento', classic: 'Clásicos', undefined: 'Otros' };
let tvData = null;
function regionName(code, fallback) {
  try { return new Intl.DisplayNames(['es'], { type: 'region' }).of(code) || fallback; } catch { return fallback || code; }
}
async function loadTV() {
  if (tvData) return tvData;
  const [channels, streams, countries] = await Promise.all(['channels', 'streams', 'countries'].map((n) => getJSON(IPTV_API + n + '.json')));
  const secure = location.protocol === 'https:';
  const byCh = new Map();
  for (const s of streams) {
    if (!s.channel || !s.url || !/^https?:\/\//i.test(s.url)) continue;
    if (s.user_agent || s.referrer) continue;                // requieren cabeceras especiales que el navegador no puede enviar
    if (/\.mpd(\?|#|$)/i.test(s.url)) continue;               // DASH no soportado
    if (secure && !s.url.startsWith('https:')) continue;       // contenido mixto bloqueado en la web https
    (byCh.get(s.channel) || byCh.set(s.channel, []).get(s.channel)).push(s);
  }
  const q = (s) => parseInt(String(s.quality || ''), 10) || 0;
  const list = [];
  for (const c of channels) {
    if (!c.id || c.is_nsfw || c.closed || (c.categories || []).includes('xxx')) continue;
    const st = byCh.get(c.id);
    if (!st) continue;
    list.push({ id: c.id, name: c.name || c.id, logo: c.logo || '', country: c.country || '', cats: c.categories || [], streams: st.sort((a, b) => q(b) - q(a)) });
  }
  list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const cName = new Map(countries.map((c) => [c.code, c]));
  const used = new Map();
  for (const ch of list) if (ch.country) used.set(ch.country, (used.get(ch.country) || 0) + 1);
  const cList = [...used.keys()].map((code) => ({ code, flag: cName.get(code)?.flag || '', name: regionName(code, cName.get(code)?.name || code), n: used.get(code) }))
    .sort((a, b) => (a.code === 'ES' ? -1 : b.code === 'ES' ? 1 : a.name.localeCompare(b.name, 'es')));
  const usedCats = [...new Set(list.flatMap((c) => c.cats))].filter((c) => c !== 'xxx').sort((a, b) => (TV_CATS[a] || a).localeCompare(TV_CATS[b] || b, 'es'));
  return (tvData = { list, byId: new Map(list.map((c) => [c.id, c])), countries: cList, cats: usedCats });
}
async function vTV() {
  const t = state.tv;
  const out = el('div', {}, loading('Cargando canales de iptv-org…'));
  mount(head('TV en directo', 'Canales de televisión de todo el mundo del catálogo abierto iptv-org. Solo se muestran los que figuran como activos y reproducibles.'), out);
  let data;
  try { data = await loadTV(); } catch (e) { return out.replaceChildren(errBox('No se pudo cargar el catálogo de canales (' + e.message + ').', route)); }
  if (t.country && !data.countries.some((c) => c.code === t.country)) t.country = '';
  const listBox = el('div', {});
  const count = el('small', { class: 'sub' });
  let shown = 60, matches = [];
  const draw = () => {
    const q = (state.q.tv || '').trim().toLowerCase();
    matches = data.list.filter((c) => (!t.country || c.country === t.country) && (!t.cat || c.cats.includes(t.cat)) && (!q || c.name.toLowerCase().includes(q)));
    count.textContent = matches.length + ' canales';
    const items = matches.slice(0, shown).map((c) => ({ id: 'tv:' + c.id, kind: 'tv', chid: c.id, title: c.name, thumb: c.logo,
      sub: [data.countries.find((x) => x.code === c.country)?.flag, c.cats.map((k) => TV_CATS[k] || k).slice(0, 2).join(', ')].filter(Boolean).join(' ') }));
    listBox.replaceChildren(items.length ? el('div', { class: 'grid tvgrid' }, items.map((i) => card(i))) : el('div', { class: 'empty' }, 'Sin canales con estos filtros.'),
      matches.length > shown ? el('p', {}, el('button', { class: 'btn ghost', onclick: () => { shown += 60; draw(); } }, 'Cargar más')) : null);
  };
  const countrySel = el('select', { 'aria-label': 'País', onchange: (e) => { t.country = e.target.value; shown = 60; saveState(); draw(); } },
    el('option', { value: '' }, 'Todos los países'),
    data.countries.map((c) => el('option', { value: c.code, selected: c.code === t.country }, `${c.flag} ${c.name} (${c.n})`.trim())));
  const catSel = el('select', { 'aria-label': 'Categoría', onchange: (e) => { t.cat = e.target.value; shown = 60; saveState(); draw(); } },
    el('option', { value: '' }, 'Todas las categorías'),
    data.cats.map((k) => el('option', { value: k, selected: k === t.cat }, TV_CATS[k] || k)));
  const qBox = state.q.tv ? el('span', { class: 'sub' }, `Búsqueda: «${state.q.tv}»`) : null;
  out.replaceChildren(el('div', { class: 'bar' }, countrySel, catSel, qBox,
    state.q.tv ? el('button', { class: 'btn ghost', onclick: () => { state.q.tv = ''; saveState(); route(); } }, 'Quitar búsqueda') : null, count),
    listBox,
    el('p', { class: 'attrib' }, 'Catálogo: iptv-org (proyecto comunitario de emisiones públicas). Los canales pertenecen a sus emisoras. Si alguno no funciona, suele estar caído o limitado a ciertos países.'));
  draw();
}

/* --- Radio --- */
async function vRadio() {
  const ci = Math.min(state.chip.radio ?? 0, RADIO_COUNTRIES.length - 1);
  const q = state.q.radio || '';
  const out = el('div', {}, loading());
  mount(head('Radio', 'Emisoras de todo el mundo en directo'),
    chips(RADIO_COUNTRIES, ci, (i) => { state.chip.radio = i; saveState(); route(); }),
    q ? el('p', { class: 'sub' }, `Resultados para «${q}»`) : null, out);
  const p = new URLSearchParams({ countrycode: RADIO_COUNTRIES[ci][1], limit: '60', hidebroken: 'true', order: 'clickcount', reverse: 'true' });
  if (q) p.set('name', q);
  let data = null, lastErr;
  for (const host of ['de1', 'de2', 'fi1', 'at1']) {
    try { data = await getJSON(`https://${host}.api.radio-browser.info/json/stations/search?${p}`); break; } catch (e) { lastErr = e; }
  }
  if (!data) return out.replaceChildren(errBox('No se pudo cargar el directorio de radios (' + lastErr?.message + ').', route));
  const secure = location.protocol === 'https:';
  const items = data.filter((s) => s.url_resolved && (!secure || s.url_resolved.startsWith('https:'))).slice(0, 48).map((s) => ({
    id: 'radio:' + s.stationuuid, kind: 'audio', title: s.name.trim(), src: s.url_resolved,
    sub: [s.tags?.split(',')[0], s.country].filter(Boolean).join(' · '), thumb: s.favicon || ''
  }));
  out.replaceChildren(items.length ? grid(items) : el('div', { class: 'empty' }, 'Sin emisoras. Prueba con otro país o búsqueda.'));
}

/* --- Podcasts --- */
async function vPodcasts() {
  const topic = state.q.podcasts || PODCAST_TOPICS[Math.min(state.chip.podcasts ?? 0, PODCAST_TOPICS.length - 1)];
  const out = el('div', {}, loading());
  mount(head('Podcasts', 'Directorio gratuito de podcasts'),
    chips(PODCAST_TOPICS, state.q.podcasts ? -1 : (state.chip.podcasts ?? 0), (i) => { state.chip.podcasts = i; state.q.podcasts = ''; saveState(); route(); }),
    el('p', { class: 'sub' }, `Resultados para «${topic}»`), out);
  try {
    const p = new URLSearchParams({ media: 'podcast', entity: 'podcast', limit: '30', country: 'ES', term: topic });
    const data = await getJSON('https://itunes.apple.com/search?' + p);
    const items = (data.results || []).filter((r) => r.feedUrl).map((r) => ({
      id: 'pod:' + r.collectionId, kind: 'podcast', title: r.collectionName, sub: r.artistName,
      thumb: r.artworkUrl600 || r.artworkUrl100, feed: r.feedUrl, page: r.collectionViewUrl
    }));
    out.replaceChildren(items.length ? grid(items) : el('div', { class: 'empty' }, 'Sin resultados.'));
  } catch (e) { out.replaceChildren(errBox('No se pudo cargar el directorio (' + e.message + ').', route)); }
}
async function showEpisodes(show) {
  const out = el('div', {}, loading('Leyendo episodios…'));
  mount(el('button', { class: 'btn ghost', onclick: route }, '← Volver'), head(show.title, show.sub), out);
  try {
    const xml = new DOMParser().parseFromString(await getText(show.feed), 'text/xml');
    const eps = [...xml.querySelectorAll('item')].slice(0, 60).map((n, i) => {
      const src = n.querySelector('enclosure')?.getAttribute('url');
      return src ? { id: show.id + ':' + i, kind: 'audio', src, title: n.querySelector('title')?.textContent?.trim() || 'Episodio', sub: show.title, thumb: show.thumb } : null;
    }).filter(Boolean);
    if (!eps.length) throw new Error('sin episodios');
    out.replaceChildren(trackRows(eps));
  } catch (e) {
    out.replaceChildren(errBox(IS_APP ? 'No se pudo leer el feed (' + e.message + ').' : 'Este podcast no permite leerse desde el navegador. Con la app de escritorio (.exe) funciona siempre.'),
      show.page ? el('p', {}, el('a', { href: show.page, target: '_blank', rel: 'noopener' }, 'Abrir en su página')) : null);
  }
}

/* --- Biblioteca local --- */
const VIDEO_EXT = /\.(mp4|m4v|webm|mkv|mov|avi|ogv)$/i;
const AUDIO_EXT = /\.(mp3|m4a|flac|ogg|opus|wav|aac)$/i;
const kindOf = (n) => (VIDEO_EXT.test(n) ? 'video' : AUDIO_EXT.test(n) ? 'audio' : null);
const cleanName = (n) => n.replace(/\.[^.]+$/, '').replace(/[._]+/g, ' ').trim();
async function walkHandle(dir, prefix = '', out = []) {
  for await (const [name, h] of dir.entries()) {
    if (out.length > 20000) break;
    if (h.kind === 'directory') await walkHandle(h, prefix + name + '/', out);
    else { const kind = kindOf(name); if (kind) out.push({ id: 'local:' + prefix + name, kind, title: cleanName(name), sub: prefix.replace(/\/$/, ''), handle: h }); }
  }
  return out;
}
async function pickLocal() {
  try {
    if (IS_APP) {
      const dir = await hub.pickFolder();
      if (!dir) return;
      store.set('localPath', dir);
      return scanApp(dir);
    }
    if (window.showDirectoryPicker) {
      const dir = await window.showDirectoryPicker({ mode: 'read' });
      toast('Analizando carpeta…');
      state.local = await walkHandle(dir);
      return route();
    }
    const inp = el('input', { type: 'file', webkitdirectory: true, multiple: true });
    inp.onchange = () => {
      state.local = [...inp.files].filter((f) => kindOf(f.name)).map((f) => {
        const rel = f.webkitRelativePath || f.name;
        return { id: 'local:' + rel, kind: kindOf(f.name), title: cleanName(f.name), sub: rel.split('/').slice(1, -1).join('/'), file: f };
      });
      route();
    };
    inp.click();
  } catch (e) { if (e.name !== 'AbortError') toast('No se pudo abrir la carpeta'); }
}
async function scanApp(dir) {
  toast('Analizando carpeta…');
  const files = await hub.scanFolder(dir);
  state.local = files.map((f) => ({ id: 'local:' + f.path, kind: f.kind, title: cleanName(f.name), sub: f.rel.split(/[\\/]/).slice(0, -1).join(' / '), src: f.url, path: f.path }));
  route();
}
let localFilter = 'all', localText = '';
function vLocal() {
  if (IS_APP && !state.local.length && store.get('localPath') && !vLocal.auto) { vLocal.auto = true; scanApp(store.get('localPath')).catch(() => {}); }
  const list = el('div', { class: 'list' });
  const draw = () => {
    const t = localText.toLowerCase();
    const shown = state.local.filter((f) => (localFilter === 'all' || f.kind === localFilter) && (!t || (f.title + ' ' + f.sub).toLowerCase().includes(t)));
    const aud = shown.filter((f) => f.kind === 'audio');
    list.replaceChildren(...(shown.length ? shown.slice(0, 500).map((f) =>
      el('div', { class: 'row', role: 'button', tabindex: '0', onclick: () => (f.kind === 'video' ? playVideo(f) : playAudio(aud, aud.indexOf(f))),
        onkeydown: (e) => { if (e.key === 'Enter') e.target.click(); } },
        el('span', { class: 'ic' }, f.kind === 'video' ? '🎬' : '🎵'),
        el('span', { class: 'tx' }, el('b', {}, f.title), el('small', {}, f.sub || 'Carpeta raíz')),
        IS_APP && f.path ? el('button', { class: 'act', title: 'Abrir con el reproductor del sistema', onclick: (e) => { e.stopPropagation(); hub.openPath(f.path); } }, '↗') : null))
      : [el('div', { class: 'empty' }, state.local.length ? 'Sin coincidencias.' : 'Aún no has elegido ninguna carpeta.')]));
    if (shown.length > 500) list.append(el('div', { class: 'empty' }, `Mostrando 500 de ${shown.length}. Usa el buscador para acotar.`));
  };
  const search = el('input', { type: 'search', placeholder: 'Filtrar mi biblioteca…', value: localText, oninput: (e) => { localText = e.target.value; draw(); } });
  const sel = el('select', { onchange: (e) => { localFilter = e.target.value; draw(); } },
    [['all', 'Todo'], ['video', 'Vídeo'], ['audio', 'Audio']].map(([v, l]) => el('option', { value: v, selected: v === localFilter }, l)));
  mount(head('Mi biblioteca', 'Tus propios archivos: no se suben a ningún sitio. Formatos: MP4, WebM, MKV, MP3, FLAC, OGG, M4A…'),
    el('div', { class: 'bar' }, el('button', { class: 'btn', onclick: pickLocal }, state.local.length ? 'Cambiar carpeta' : 'Elegir carpeta'),
      IS_APP && store.get('localPath') ? el('button', { class: 'btn ghost', onclick: () => scanApp(store.get('localPath')) }, 'Reanalizar') : null,
      state.local.length ? [search, sel, el('small', { class: 'sub' }, state.local.length + ' archivos')] : null),
    list);
  draw();
}

function vFavs() {
  mount(head('Favoritos', 'Lo que has marcado con ★'),
    state.favs.length ? grid(state.favs, { onFav: () => setTimeout(route, 0) }) : el('div', { class: 'empty' }, 'Todavía no hay favoritos. Pulsa ☆ en cualquier tarjeta.'));
}

/* --- Plataformas --- */
const PT = [['', 'Todo'], ['directo', 'Directo'], ['cine', 'Cine'], ['series', 'Series'], ['docs', 'Documentales']];
const PL = [['', 'Cualquier idioma'], ['es', 'Español'], ['en', 'Inglés'], ['ca', 'Catalán'], ['fr', 'Francés'], ['de', 'Alemán']];
function vEnlaces() {
  const f = state.chip.plat || { t: '', l: '' };
  const shown = PLATFORMS.filter((p) => (!f.t || p.t.includes(f.t)) && (!f.l || p.l.includes(f.l)));
  const set = (k, v) => { state.chip.plat = { ...f, [k]: v }; saveState(); route(); };
  mount(head('Plataformas gratuitas y legales', 'Se abren en tu navegador. El doblaje y los subtítulos se eligen en el reproductor de cada una.'),
    el('div', { class: 'chips' }, PT.map(([v, l]) => el('button', { class: 'chip' + (f.t === v ? ' on' : ''), onclick: () => set('t', v) }, l))),
    el('div', { class: 'chips' }, PL.map(([v, l]) => el('button', { class: 'chip' + (f.l === v ? ' on' : ''), onclick: () => set('l', v) }, l))),
    shown.length ? el('div', { class: 'links' }, shown.map((p) => el('a', { href: p.u, target: '_blank', rel: 'noopener noreferrer' }, el('b', {}, p.n), el('small', {}, p.d))))
      : el('div', { class: 'empty' }, 'Ninguna plataforma coincide con esos filtros.'),
    el('h2', {}, 'Música y libros'),
    el('div', { class: 'links' }, MORE_LINKS.map(([n, u, d]) => el('a', { href: u, target: '_blank', rel: 'noopener noreferrer' }, el('b', {}, n), el('small', {}, d)))));
}

/* --- Ajustes --- */
async function vAjustes() {
  const saved = store.get('keys', {});
  const inputs = {};
  const rows = Object.entries(KEYS).map(([k, m]) => {
    const src = keySource(k);
    inputs[k] = el('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: src === '.env' ? 'Detectada en el archivo .env' : 'Pega aquí tu clave', value: saved[k] || '' });
    return el('div', {}, el('label', {}, m.label, el('span', { class: 'status' + (src ? ' ok' : '') }, src ? '✔ activa (' + src + ')' : 'sin configurar')),
      inputs[k], el('small', {}, m.hint, ' ', el('a', { href: m.url, target: '_blank', rel: 'noopener noreferrer' }, 'Conseguir clave')));
  });
  const envBox = el('div', {});
  if (IS_APP) {
    const info = await hub.configInfo();
    envBox.replaceChildren(el('h2', {}, 'Archivo .env'),
      el('p', { class: 'sub' }, info.exists ? 'Se lee el archivo: ' + info.file : 'Aún no hay .env. Se buscará en: ' + info.dir),
      el('button', { class: 'btn ghost', onclick: async () => { await hub.initEnv(); toast('Listo: edita el .env y reinicia la app'); vAjustes(); } }, info.exists ? 'Abrir carpeta del .env' : 'Crear .env de ejemplo'));
  }
  mount(head('Ajustes', 'Las claves son gratuitas y personales. Sin ellas la app funciona igual con Internet Archive, Audius, radio y podcasts.'),
    el('form', { class: 'setup', onsubmit: (e) => {
      e.preventDefault();
      const out = {}; for (const k in inputs) if (inputs[k].value.trim()) out[k] = inputs[k].value.trim();
      store.set('keys', out); toast('Claves guardadas'); vAjustes();
    } }, rows,
    el('p', { style: 'margin-top:18px' }, el('button', { class: 'btn', type: 'submit' }, 'Guardar'), ' ',
      el('button', { class: 'btn ghost', type: 'button', onclick: () => { store.set('keys', {}); toast('Claves borradas'); vAjustes(); } }, 'Borrar claves guardadas')),
    el('small', {}, IS_APP ? 'Se guardan en este equipo.' : 'Se guardan solo en este navegador (localStorage); en una web pública no pongas claves en el código, cada visitante usa las suyas.')),
    envBox, tmdbAttribution());
}

/* ---------- navegación ---------- */
const nav = $('#nav');
nav.replaceChildren(...Object.entries(VIEWS).map(([k, v]) => el('a', { href: '#' + k, 'data-v': k }, el('span', {}, v.icon), v.label)));
function route() {
  const k = (location.hash.slice(1) || 'inicio');
  const key = VIEWS[k] ? k : 'inicio';
  nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.v === key));
  if (VIEWS[key].scope) $('#scope').value = key;
  $('#q').value = state.q[key] || '';
  document.title = 'Media Hub · ' + VIEWS[key].label;
  const fn = { inicio: vInicio, cine: vCine, musica: vMusica, tv: vTV, radio: vRadio, podcasts: vPodcasts, listas: vListas, local: vLocal, favs: vFavs, enlaces: vEnlaces, ajustes: vAjustes }[key];
  if (fn) fn(); else vIAFull(key);
}
window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
$('#searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const s = $('#scope').value, t = $('#q').value.trim();
  state.q[s] = t; saveState();
  if (location.hash === '#' + s) route(); else location.hash = '#' + s;
});

/* PWA: solo cuando se sirve por http(s) fuera del .exe */
if (!IS_APP && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});

(async () => {
  if (IS_APP) { try { envCfg = (await hub.getConfig()) || {}; } catch { envCfg = {}; } }
  route();
})();
