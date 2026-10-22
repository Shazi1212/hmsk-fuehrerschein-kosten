// Embed widget (embed.html): reads the iframe URL parameters and builds the credit link. Pure, no DOM, so it is tested.
import { CLASSES, STATES, TOWN } from './data.js';

export const HOME = 'https://hmsk.life';
// School prices a driving school may pass in the iframe URL (same keys as the calculator's own-quote fields).
export const SCHOOL_KEYS = ['base', 'material', 'lesson', 'special', 'presentTheory', 'presentPractical', 'testDrive'];

// Cities over 100,000 inhabitants and state capitals -> [Bundesland, town size]. Unknown cities keep the default region.
const CITY = {
  berlin: ['BE', 'large'], hamburg: ['HH', 'large'], muenchen: ['BY', 'large'], koeln: ['NW', 'large'],
  frankfurt: ['HE', 'large'], stuttgart: ['BW', 'large'], duesseldorf: ['NW', 'large'], leipzig: ['SN', 'large'],
  dortmund: ['NW', 'large'], essen: ['NW', 'large'], bremen: ['HB', 'large'], dresden: ['SN', 'large'],
  hannover: ['NI', 'large'], nuernberg: ['BY', 'large'], duisburg: ['NW', 'large'], bochum: ['NW', 'large'],
  wuppertal: ['NW', 'large'], bielefeld: ['NW', 'large'], bonn: ['NW', 'large'], muenster: ['NW', 'large'],
  mannheim: ['BW', 'large'], karlsruhe: ['BW', 'large'], augsburg: ['BY', 'large'], wiesbaden: ['HE', 'large'],
  moenchengladbach: ['NW', 'large'], gelsenkirchen: ['NW', 'large'], aachen: ['NW', 'large'], braunschweig: ['NI', 'large'],
  kiel: ['SH', 'large'], chemnitz: ['SN', 'large'], halle: ['ST', 'large'], magdeburg: ['ST', 'large'],
  freiburg: ['BW', 'large'], krefeld: ['NW', 'large'], mainz: ['RP', 'large'], luebeck: ['SH', 'large'],
  erfurt: ['TH', 'large'], oberhausen: ['NW', 'large'], rostock: ['MV', 'large'], kassel: ['HE', 'large'],
  hagen: ['NW', 'large'], potsdam: ['BB', 'large'], saarbruecken: ['SL', 'large'], hamm: ['NW', 'large'],
  ludwigshafen: ['RP', 'large'], oldenburg: ['NI', 'large'], muelheim: ['NW', 'large'], osnabrueck: ['NI', 'large'],
  leverkusen: ['NW', 'large'], darmstadt: ['HE', 'large'], heidelberg: ['BW', 'large'], solingen: ['NW', 'large'],
  regensburg: ['BY', 'large'], wuerzburg: ['BY', 'large'], ingolstadt: ['BY', 'large'], ulm: ['BW', 'large'],
  wolfsburg: ['NI', 'large'], goettingen: ['NI', 'large'], heilbronn: ['BW', 'large'], pforzheim: ['BW', 'large'],
  offenbach: ['HE', 'large'], bottrop: ['NW', 'large'], recklinghausen: ['NW', 'large'], reutlingen: ['BW', 'large'],
  bremerhaven: ['HB', 'large'], koblenz: ['RP', 'large'], erlangen: ['BY', 'large'], trier: ['RP', 'large'],
  jena: ['TH', 'large'], fuerth: ['BY', 'large'], salzgitter: ['NI', 'large'], hildesheim: ['NI', 'large'],
  paderborn: ['NW', 'large'], siegen: ['NW', 'large'], guetersloh: ['NW', 'large'], cottbus: ['BB', 'medium'],
  schwerin: ['MV', 'medium'],
};
const ALIAS = { frankfurtammain: 'frankfurt', freiburgimbreisgau: 'freiburg', hallesaale: 'halle', ludwigshafenamrhein: 'ludwigshafen',
  muelheimanderruhr: 'muelheim', offenbachammain: 'offenbach', munich: 'muenchen', cologne: 'koeln', nuremberg: 'nuernberg' };

const cityKey = s => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z]/g, '');
// Free text from a URL: no control characters, collapsed spaces, at most `max` characters. Rendered with textContent.
const text = (v, max) => (v || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const price = v => {
  if (v === null || v === '') return null;
  const n = Number(String(v).trim().replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return isFinite(n) && n >= 0 && n <= 10000 ? Math.round(n * 100) / 100 : null;
};

export function cityRegion(city) {
  const k = cityKey(city || '');
  return CITY[ALIAS[k] || k] || null;
}

// URLSearchParams string -> { lang, cls, state, town, hours, city, school, overrides, hasSchoolPrices }
export function parseEmbed(search) {
  const q = new URLSearchParams(search);
  const city = text(q.get('city'), 40);
  const region = cityRegion(city);
  const cls = q.get('cls') || q.get('class');
  const hours = price(q.get('hours'));
  const overrides = {};
  for (const k of SCHOOL_KEYS) {
    const v = price(q.get(k));
    if (v !== null) overrides[k] = v;
  }
  const hasSchoolPrices = Object.keys(overrides).length > 0;
  return {
    lang: q.get('lang') === 'en' ? 'en' : 'de',
    cls: CLASSES.includes(cls) ? cls : 'B',
    state: STATES[q.get('state')] ? q.get('state') : region ? region[0] : 'NW',
    town: TOWN[q.get('town')] ? q.get('town') : region ? region[1] : 'medium',
    hours: hours !== null && hours <= 200 ? Math.round(hours) : null,
    city,
    // the school's name is shown only together with its own prices
    school: hasSchoolPrices ? text(q.get('school'), 60) : '',
    overrides,
    hasSchoolPrices,
  };
}

// Host of the page that embeds the widget, from document.referrer; 'embed' if there is none.
export function embedSource(referrer) {
  try {
    const u = new URL(referrer);
    if (!/^https?:$/.test(u.protocol)) return 'embed';
    const h = u.hostname.toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9.-]/g, '');
    return h && h !== 'hmsk.life' ? h.slice(0, 80) : 'embed';
  } catch { return 'embed'; }
}

// Link to hmsk.life with the widget UTM; `path` is a site path, `hash` an optional #fragment, `extra` more parameters.
export function creditUrl(referrer, path, hash = '', extra = {}) {
  const p = new URLSearchParams({ ...extra, utm_source: embedSource(referrer), utm_medium: 'widget', utm_campaign: 'fuehrerschein-widget' });
  return HOME + path + '?' + p + hash;
}
