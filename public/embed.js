// Embed widget UI (embed.html): class, hours and region in, typical total, range and groups out. Same calculation as
// the full app; no storage, no cookies, no requests. Settings come from the iframe URL (embed-params.js).
import { DEFAULTS, SCEN, compute } from './calc.js';
import { CLASSES, STATES, TOWN, PRICES, CHECKED } from './data.js';
import { TEXT } from './i18n.js?v=embed1';   // versioned: older cached copies have no embed texts
import { parseEmbed, creditUrl } from './embed-params.js';

// Count the widget as its own source in the cookie-less hmsk.life counter (a.js reads the URL when it runs, after
// this module). The embedding site is still visible there as the referrer.
{
  const q = new URLSearchParams(location.search);
  if (!q.get('utm_source')) {
    q.set('utm_source', 'embed'); q.set('utm_medium', 'widget'); q.set('utm_campaign', 'fuehrerschein-widget');
    history.replaceState(null, '', location.pathname + '?' + q + location.hash);
  }
}

const $ = s => document.querySelector(s);
// same neutral ink/blue ramp as the full app (app.js)
const COLORS = { school: '#1E4C8A', official: '#6E7F95', other: '#151B24', retake: '#4B78B4' };
const P = parseEmbed(location.search);
const lang = P.lang, T = TEXT[lang], E = T.embed;
const state = structuredClone(DEFAULTS);
Object.assign(state, { cls: P.cls, state: P.state, town: P.town, hours: P.hours });
Object.assign(state.overrides, P.overrides);

const locale = lang === 'de' ? 'de-DE' : 'en-GB';
const eur = v => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const checked = new Intl.DateTimeFormat(locale, { day: 'numeric', month: lang === 'de' ? '2-digit' : 'short', year: 'numeric' }).format(new Date(CHECKED));
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const options = (sel, entries) => { sel.replaceChildren(...entries.map(([v, label]) => { const o = el('option', '', label); o.value = v; return o; })); };

function setup() {
  document.documentElement.lang = lang;
  for (const n of document.querySelectorAll('[data-e]')) { const v = E[n.dataset.e]; if (typeof v === 'string') n.textContent = v; }
  $('#eTitle').textContent = P.city ? E.titleCity(P.city) : E.title;
  if (P.school) { $('#eSchool').textContent = E.school(P.school); $('#eSchool').hidden = false; }
  $('#eNote').textContent = P.hasSchoolPrices ? E.noteSchool(P.school || (lang === 'de' ? 'Ihrer Fahrschule' : 'your driving school'), checked) : E.note(checked);
  options($('#cls'), CLASSES.map(c => [c, T.classes[c]]));
  options($('#state'), Object.entries(STATES).map(([k, [n]]) => [k, n]));
  options($('#town'), Object.keys(TOWN).map(k => [k, T.towns[k]]));
  $('#cls').value = state.cls; $('#state').value = state.state; $('#town').value = state.town;
  $('#hours').value = state.hours ?? '';
  const path = lang === 'de' ? '/de/tools/fuehrerschein-kosten/' : '/tools/fuehrerschein-kosten/';
  $('#eCredit').href = creditUrl(document.referrer, path);
}

function links() {
  const h = new URLSearchParams({ cls: state.cls, state: state.state, town: state.town });
  if (state.hours !== null) h.set('hours', state.hours);
  for (const [k, v] of Object.entries(state.overrides)) if (v !== null) h.set('o_' + k, v);
  $('#eMore').href = creditUrl(document.referrer, '/apps/fuehrerschein-kosten/', '#' + h, { lang });
}

function render() {
  const r = compute(state), H = PRICES[state.cls].hours;
  $('#hours').placeholder = `${H.low}-${H.high}`;
  $('#total').textContent = eur(r.total.typ);
  $('#scen').replaceChildren(...SCEN.map(s => {
    const d = el('div', s === 'typ' ? 'on' : '');
    d.append(el('dt', '', T.scen[s]), el('dd', '', eur(r.total[s])));
    return d;
  }));
  const groups = Object.entries(r.groups).filter(([, v]) => v.typ > 0);
  $('#bar').replaceChildren(...groups.map(([g, v]) => {
    const s = el('span'); s.title = T.groups[g];
    s.style.width = (v.typ / r.total.typ) * 100 + '%'; s.style.background = COLORS[g];   // CSSOM, allowed by the CSP
    return s;
  }));
  $('#bar').setAttribute('aria-label', groups.map(([g, v]) => `${T.groups[g]} ${eur(v.typ)}`).join(', '));
  $('#legend').replaceChildren(...groups.map(([g, v]) => {
    const li = el('li'), i = el('i'); i.style.background = COLORS[g];
    li.append(i, el('span', '', T.groups[g]), el('span', 'v', eur(v.typ)));
    return li;
  }));
  links();
}

function update() {
  state.cls = CLASSES.includes($('#cls').value) ? $('#cls').value : 'B';
  state.state = $('#state').value; state.town = $('#town').value;
  const h = $('#hours').value;
  state.hours = h === '' || !isFinite(Number(h)) || Number(h) < 0 ? null : Math.min(Math.round(Number(h)), 200);
  render();
}

$('#eForm').addEventListener('input', update);
$('#eForm').addEventListener('change', update);
$('#eForm').addEventListener('submit', e => e.preventDefault());
setup();
render();
