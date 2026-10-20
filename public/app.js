// UI: reads the form, calls the pure calc module, renders. State in localStorage and the URL hash.
import { DEFAULTS, OVERRIDE_KEYS, SCEN, compute, retakeCost, priceFactor } from './calc.js';
import { CLASSES, STATES, TOWN, RULES, PRICES, OTHER, OFFICIAL, SOURCES, LINK_BASE, CHECKED } from './data.js';
import { TEXT } from './i18n.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STORE = 'hmsk-fuehrerschein-kosten-v1';
const SP = ['rural', 'motorway', 'night'];
const GROUP_KEYS = { school: ['base', 'material', 'lesson', 'special', 'testDrive', 'presentTheory', 'presentPractical'], official: ['theoryFee', 'practicalFee'], other: ['office', 'eyeTest', 'firstAid', 'photo'] };
// cost groups: distinct A1 hues, each ≥ 5:1 against the card background
const COLORS = { school: '#1E4C8A', official: '#2B6440', other: '#6B3F8F', retake: '#A3262A' };

let lang = pickLang();
let state = loadState();

function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'de' || q === 'en') return q;
  try { const s = localStorage.getItem(STORE + '-lang'); if (s === 'de' || s === 'en') return s; } catch {}
  const n = (navigator.language || 'de').toLowerCase();
  return n.startsWith('de') || !n ? 'de' : 'en';
}
const t = () => TEXT[lang];

// ---------- state <-> hash / storage ----------
const numOrNull = v => (v === null || v === undefined || v === '' || !isFinite(Number(v)) || Number(v) < 0 ? null : Number(v));
function sanitize(raw) {
  const o = structuredClone(DEFAULTS);
  if (!raw || typeof raw !== 'object') return o;
  if (CLASSES.includes(raw.cls)) o.cls = raw.cls;
  if (STATES[raw.state]) o.state = raw.state;
  if (TOWN[raw.town]) o.town = raw.town;
  o.hours = numOrNull(raw.hours);
  o.retakeLessons = numOrNull(raw.retakeLessons);
  for (const k of ['theoryRetakes', 'practicalRetakes']) o[k] = Math.min(Math.max(Math.round(Number(raw[k]) || 0), 0), 5);
  for (const k of ['haveFirstAid', 'haveEyeTest']) o[k] = raw[k] === true || raw[k] === '1';
  const sp = raw.special || {};
  for (const k of SP) o.special[k] = numOrNull(sp[k] ?? raw['sp_' + k]);
  const ov = raw.overrides || {};
  for (const k of OVERRIDE_KEYS) o.overrides[k] = numOrNull(ov[k] ?? raw['o_' + k]);
  return o;
}
function toHash(o) {
  const p = new URLSearchParams();
  p.set('cls', o.cls); p.set('state', o.state); p.set('town', o.town);
  if (o.hours !== null) p.set('hours', o.hours);
  if (o.retakeLessons !== null) p.set('retakeLessons', o.retakeLessons);
  if (o.theoryRetakes) p.set('theoryRetakes', o.theoryRetakes);
  if (o.practicalRetakes) p.set('practicalRetakes', o.practicalRetakes);
  if (o.haveFirstAid) p.set('haveFirstAid', '1');
  if (o.haveEyeTest) p.set('haveEyeTest', '1');
  for (const k of SP) if (o.special[k] !== null) p.set('sp_' + k, o.special[k]);
  for (const k of OVERRIDE_KEYS) if (o.overrides[k] !== null) p.set('o_' + k, o.overrides[k]);
  return p.toString();
}
function loadState() {
  const h = location.hash.slice(1);
  if (h.includes('=')) return sanitize(Object.fromEntries(new URLSearchParams(h)));
  try { const s = localStorage.getItem(STORE); if (s) return sanitize(JSON.parse(s)); } catch {}
  return sanitize(null);
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {}
  history.replaceState(null, '', location.pathname + location.search + '#' + toHash(state));
}

// ---------- formatting ----------
const locale = () => (lang === 'de' ? 'de-DE' : 'en-GB');
const eur = (v, d = 0) => new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
const eur2 = v => eur(v, Number.isInteger(v) ? 0 : 2);
const pct = v => new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 0 }).format(v);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- static texts ----------
function applyTexts() {
  const T = t();
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  for (const el of $$('[data-t]')) {
    const v = T[el.dataset.t];
    if (typeof v === 'string') el.textContent = v;
  }
  $('#langBtn').setAttribute('aria-label', T.langSwitchLabel);
  const de = lang === 'de', base = LINK_BASE;
  $('#lnkHome').href = $('#lnkHome2').href = base + (de ? '/de/tools/fuehrerschein-kosten/' : '/tools/fuehrerschein-kosten/');
  $('#lnkImprint').href = base + (de ? '/impressum/' : '/imprint/');
  $('#lnkPrivacy').href = base + (de ? '/datenschutz/' : '/privacy/');
  $('#lnkNotify').href = base + (de ? '/de/newsletter/?topic=fuehrerschein-kosten' : '/subscribe/?topic=fuehrerschein-kosten');

  $('#cls').innerHTML = CLASSES.map(c => `<option value="${c}">${esc(T.classes[c])}</option>`).join('');
  $('#state').innerHTML = Object.entries(STATES).map(([k, [n]]) => `<option value="${k}">${esc(n)}</option>`).join('');
  $('#town').innerHTML = Object.keys(TOWN).map(k => `<option value="${k}">${esc(T.towns[k])}</option>`).join('');
  for (const id of ['theoryRetakes', 'practicalRetakes']) $('#' + id).innerHTML = [0, 1, 2, 3].map(n => `<option value="${n}">${esc(T.retakeOpt(n))}</option>`).join('');
  $('#assumptions').innerHTML = T.assumptions.map(a => `<li>${esc(a)}</li>`).join('');
  $('#sources').innerHTML = T.src.map(([label, key]) => `<li><a href="${esc(SOURCES[key])}" rel="noopener" target="_blank">${esc(label)}</a></li>`).join('');
  $('#checked').textContent = T.checked(CHECKED);
  buildQuote();
}

// own-quote fields: one per item that applies to the class, estimate as placeholder
function buildQuote() {
  const T = t(), cls = state.cls, rule = RULES[cls], P = PRICES[cls];
  const f = priceFactor(state.state, state.town);
  const applies = {
    base: true, material: P.material.high > 0, lesson: true, special: P.special.high > 0,
    testDrive: rule.testDrive, presentTheory: rule.theoryExam && P.presentTheory.high > 0, presentPractical: !!rule.practical,
    theoryFee: rule.theoryExam, practicalFee: !!rule.practical, office: rule.office, eyeTest: rule.eyeTest, firstAid: rule.firstAid, photo: true,
  };
  const est = k => {
    if (k === 'theoryFee') return cls === 'Mofa' ? OFFICIAL.mofaExam : OFFICIAL.theory;
    if (k === 'practicalFee') return OFFICIAL[rule.practical];
    if (OTHER[k]) return OTHER[k].typ;
    return Math.round(P[k].typ * f * 100) / 100;
  };
  const heads = { school: T.quoteSchool, official: T.quoteOfficial, other: T.quoteOther };
  let html = '';
  for (const [g, keys] of Object.entries(GROUP_KEYS)) {
    const ks = keys.filter(k => applies[k]);
    if (!ks.length) continue;
    html += `<p class="lbl grp">${esc(heads[g])}</p>`;
    for (const k of ks) {
      const ph = new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(est(k));
      const unit = k === 'lesson' || k === 'special' ? (lang === 'de' ? ' / Std.' : ' / lesson') : '';
      html += `<div class="cost"><label for="o-${k}">${esc(T.items[k])}${esc(unit)}</label><div class="money"><input id="o-${k}" data-ov="${k}" type="number" inputmode="decimal" min="0" step="any" placeholder="${ph}"><span>€</span></div></div>`;
    }
  }
  $('#quote').innerHTML = html;
  for (const el of $$('[data-ov]')) el.value = state.overrides[el.dataset.ov] ?? '';
}

// ---------- form <-> state ----------
function fillForm() {
  for (const k of ['cls', 'state', 'town']) $('#' + k).value = state[k];
  $('#hours').value = state.hours ?? '';
  $('#retakeLessons').value = state.retakeLessons ?? '';
  $('#theoryRetakes').value = state.theoryRetakes;
  $('#practicalRetakes').value = state.practicalRetakes;
  $('#haveFirstAid').checked = state.haveFirstAid;
  $('#haveEyeTest').checked = state.haveEyeTest;
  for (const k of SP) $('#sp-' + k).value = state.special[k] ?? '';
  for (const el of $$('[data-ov]')) el.value = state.overrides[el.dataset.ov] ?? '';
}
function readForm() {
  const raw = {
    cls: $('#cls').value, state: $('#state').value, town: $('#town').value,
    hours: $('#hours').value, retakeLessons: $('#retakeLessons').value,
    theoryRetakes: $('#theoryRetakes').value, practicalRetakes: $('#practicalRetakes').value,
    haveFirstAid: $('#haveFirstAid').checked, haveEyeTest: $('#haveEyeTest').checked,
    special: {}, overrides: { ...state.overrides },
  };
  for (const k of SP) raw.special[k] = $('#sp-' + k).value;
  for (const el of $$('[data-ov]')) raw.overrides[el.dataset.ov] = el.value;
  state = sanitize(raw);
}

// ---------- render ----------
function render() {
  const T = t(), r = compute(state), cls = state.cls, rule = RULES[cls], P = PRICES[cls];
  $('#cmdCls').textContent = cls;
  $('#classHint').textContent = T.classHint[cls];
  $('#factorInfo').textContent = T.factorInfo(pct(r.factor));
  $('#hoursHint').textContent = T.hoursHint(P.hours.low, P.hours.typ, P.hours.high);
  $('#hours').placeholder = `${P.hours.low}-${P.hours.high}`;
  $('#retakeLessons').placeholder = '1-5';
  const min = r.special.min, hasSp = min.rural + min.motorway + min.night > 0;
  for (const k of SP) $('#sp-' + k).placeholder = min[k];
  $('#specialHint').textContent = hasSp ? T.specialHint(min.rural, min.motorway, min.night) : T.specialNone;
  const form = $('#form');
  form.dataset.special = hasSp ? '1' : '0';
  form.dataset.theory = rule.theoryExam ? '1' : '0';
  form.dataset.practical = rule.practical ? '1' : '0';
  form.dataset.done = rule.firstAid || rule.eyeTest ? '1' : '0';

  $('#total').textContent = eur(r.total.typ);
  $('#range').textContent = T.range(eur(r.total.low), eur(r.total.high));
  $('#scen').innerHTML = SCEN.map(s => `<div class="${s === 'typ' ? 'on' : ''}"><dt>${esc(T.scen[s])}</dt><dd>${eur(r.total[s])}</dd></div>`).join('');

  // bar by group (typical)
  const groups = Object.entries(r.groups).filter(([, v]) => v.typ > 0);
  $('#bar').innerHTML = groups.map(([g, v]) => `<span style="width:${(v.typ / r.total.typ) * 100}%;background:${COLORS[g]}" title="${esc(T.groups[g])}"></span>`).join('');
  $('#bar').setAttribute('aria-label', groups.map(([g, v]) => `${T.groups[g]} ${eur(v.typ)}`).join(', '));
  $('#legend').innerHTML = groups.map(([g, v]) => `<li><i style="background:${COLORS[g]}"></i><span>${esc(T.groups[g])}</span><span class="v">${eur(v.typ)}</span><span class="p">${pct(v.typ / r.total.typ)}</span></li>`).join('');

  // table
  const tag = l => (l.overridden ? T.own : l.official ? T.official : l.group === 'retake' ? '' : T.estimate);
  const detail = l => {
    if (l.key === 'lesson') return T.qtyHours(l.qty.typ, eur2(l.unit.typ));
    if (l.key === 'special') return T.specialDetail(l.counts.rural, l.counts.motorway, l.counts.night) + ' · ' + T.qtyHours(l.qty.typ, eur2(l.unit.typ));
    if (l.group === 'retake') return T.qtyHours(l.qty.typ, eur2(l.unit.typ)) + (l.retakeLessons ? ' · ' + T.retakeDetail(l.retakeLessons.typ) : '');
    return '';
  };
  let rows = '', lastGroup = '';
  for (const l of r.lines) {
    if (l.group !== lastGroup) {
      rows += `<tr class="g"><td colspan="3">${esc(T.groups[l.group])} <span>${eur(r.groups[l.group].typ)}</span></td></tr>`;
      lastGroup = l.group;
    }
    const d = detail(l), tg = tag(l);
    const rng = l.total.low === l.total.high ? '' : `${eur(l.total.low)} - ${eur(l.total.high)}`;
    rows += `<tr><td>${esc(T.items[l.key])}${d ? `<small>${esc(d)}</small>` : ''}${tg ? ` <em class="tag${l.official ? ' tag--off' : ''}">${esc(tg)}</em>` : ''}</td><td class="n">${eur2(l.total.typ)}</td><td class="n r">${rng}</td></tr>`;
  }
  rows += `<tr class="tot"><td>${lang === 'de' ? 'Gesamt' : 'Total'}</td><td class="n">${eur(r.total.typ)}</td><td class="n r">${eur(r.total.low)} - ${eur(r.total.high)}</td></tr>`;
  $('#tbl tbody').innerHTML = rows;

  const rc = retakeCost(state);
  $('#retakeNote').textContent = T.retakeNote(eur(rc.typ), eur(rc.low), eur(rc.high));
}

function update() { readForm(); render(); save(); }

// ---------- events ----------
$('#form').addEventListener('input', e => {
  const rebuild = ['cls', 'state', 'town'].includes(e.target.id);
  update();
  if (rebuild) buildQuote();
});
$('#form').addEventListener('change', e => { if (['cls', 'state', 'town'].includes(e.target.id)) { update(); buildQuote(); } });
$('#langBtn').addEventListener('click', () => {
  lang = lang === 'de' ? 'en' : 'de';
  try { localStorage.setItem(STORE + '-lang', lang); } catch {}
  applyTexts(); fillForm(); render();
});
$('#shareBtn').addEventListener('click', async () => {
  save();
  const btn = $('#shareBtn');
  try { await navigator.clipboard.writeText(location.href); btn.textContent = t().shared; } catch { prompt('URL', location.href); }
  setTimeout(() => { btn.textContent = t().share; }, 1800);
});
$('#printBtn').addEventListener('click', () => window.print());
$('#resetBtn').addEventListener('click', () => {
  state = sanitize(null);
  try { localStorage.removeItem(STORE); } catch {}
  history.replaceState(null, '', location.pathname + location.search);
  buildQuote(); fillForm(); render();
});

applyTexts();
fillForm();
render();
