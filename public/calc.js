// Pure calculation, no DOM. compute(input) -> line items and totals for three scenarios (low, typ, high).
import { OFFICIAL, SPECIAL, RULES, PRICES, OTHER, STATES, TOWN, RETAKE_LESSONS, CLASSES } from './data.js';

export const SCEN = ['low', 'typ', 'high'];
// Keys the user can override with their own quote (one price for all three scenarios).
export const OVERRIDE_KEYS = ['base', 'material', 'lesson', 'special', 'presentTheory', 'presentPractical', 'testDrive',
  'theoryFee', 'practicalFee', 'office', 'eyeTest', 'firstAid', 'photo'];

export const DEFAULTS = {
  cls: 'B', state: 'NW', town: 'medium',
  hours: null,                                   // null = typical for the class (range low..high)
  special: { rural: null, motorway: null, night: null }, // null = legal minimum
  theoryRetakes: 0, practicalRetakes: 0, retakeLessons: null,
  haveFirstAid: false, haveEyeTest: false,
  overrides: Object.fromEntries(OVERRIDE_KEYS.map(k => [k, null])),
};

const r2 = v => Math.round(v * 100) / 100;
const isNum = v => typeof v === 'number' && isFinite(v) && v >= 0;
const same = v => ({ low: v, typ: v, high: v });

export function priceFactor(state, town) {
  return (STATES[state] ? STATES[state][1] : 1) * (TOWN[town] ?? 1);
}

export function specialCounts(input) {
  const min = SPECIAL[input.cls];
  const o = input.special || {};
  const pick = k => (isNum(o[k]) ? Math.round(o[k]) : min[k]);
  const c = { rural: pick('rural'), motorway: pick('motorway'), night: pick('night') };
  c.total = c.rural + c.motorway + c.night;
  c.min = min;
  return c;
}

export function compute(raw) {
  const input = { ...DEFAULTS, ...raw, overrides: { ...DEFAULTS.overrides, ...(raw && raw.overrides) } };
  if (!CLASSES.includes(input.cls)) input.cls = 'B';
  const cls = input.cls, rule = RULES[cls], P = PRICES[cls], ov = input.overrides;
  const f = priceFactor(input.state, input.town);

  // unit price per scenario: own quote > market estimate x regional factor
  const school = key => (isNum(ov[key]) ? same(ov[key]) : { low: r2(P[key].low * f), typ: r2(P[key].typ * f), high: r2(P[key].high * f) });
  const other = (key, est) => (isNum(ov[key]) ? same(ov[key]) : { ...est });
  const fixed = (key, v) => (isNum(ov[key]) ? same(ov[key]) : same(v));

  const hours = isNum(input.hours) ? same(Math.round(input.hours)) : { ...P.hours };
  const sp = specialCounts(input);
  const lines = [];
  const add = (key, group, qty, unit, extra = {}) => {
    const q = typeof qty === 'number' ? same(qty) : qty;
    const total = {};
    for (const s of SCEN) total[s] = r2(q[s] * unit[s]);
    lines.push({ key, group, qty: q, unit, total, overridden: isNum(ov[extra.ovKey || key]), ...extra });
  };

  // driving school
  add('base', 'school', 1, school('base'));
  if (P.material.high > 0) add('material', 'school', 1, school('material'));
  add('lesson', 'school', hours, school('lesson'));
  if (sp.total > 0) add('special', 'school', sp.total, school('special'), { counts: sp });
  if (rule.testDrive) add('testDrive', 'school', 1, school('testDrive'));
  if (rule.theoryExam && P.presentTheory.high > 0) add('presentTheory', 'school', 1, school('presentTheory'));
  if (rule.practical) add('presentPractical', 'school', 1, school('presentPractical'));

  // official fees (TÜV / DEKRA)
  const theoryFee = cls === 'Mofa' ? OFFICIAL.mofaExam : OFFICIAL.theory;
  if (rule.theoryExam) add('theoryFee', 'official', 1, fixed('theoryFee', theoryFee), { official: true });
  const practicalFee = rule.practical ? OFFICIAL[rule.practical] : 0;
  if (rule.practical) add('practicalFee', 'official', 1, fixed('practicalFee', practicalFee), { official: true });

  // outside the school
  if (rule.office) add('office', 'other', 1, other('office', OTHER.office));
  if (rule.eyeTest && !input.haveEyeTest) add('eyeTest', 'other', 1, other('eyeTest', OTHER.eyeTest));
  if (rule.firstAid && !input.haveFirstAid) add('firstAid', 'other', 1, other('firstAid', OTHER.firstAid));
  add('photo', 'other', 1, other('photo', OTHER.photo));

  // repeat exams
  const tr = rule.theoryExam ? Math.max(0, Math.round(input.theoryRetakes || 0)) : 0;
  const pr = rule.practical ? Math.max(0, Math.round(input.practicalRetakes || 0)) : 0;
  if (tr > 0) {
    const fee = isNum(ov.theoryFee) ? ov.theoryFee : (cls === 'Mofa' ? OFFICIAL.mofaRetake : OFFICIAL.theory);
    const pres = school('presentTheory');
    const unit = {};
    for (const s of SCEN) unit[s] = r2(fee + (P.presentTheory.high > 0 ? pres[s] : 0));
    add('theoryRetake', 'retake', tr, unit, { ovKey: '_' });
  }
  if (pr > 0) {
    const fee = isNum(ov.practicalFee) ? ov.practicalFee : practicalFee;
    const pres = school('presentPractical'), lesson = school('lesson');
    const n = isNum(input.retakeLessons) ? same(Math.round(input.retakeLessons)) : RETAKE_LESSONS;
    const unit = {};
    for (const s of SCEN) unit[s] = r2(fee + pres[s] + n[s] * lesson[s]);
    add('practicalRetake', 'retake', pr, unit, { ovKey: '_', retakeLessons: n });
  }

  const total = {}, groups = {};
  for (const s of SCEN) total[s] = r2(lines.reduce((a, l) => a + l.total[s], 0));
  for (const l of lines) {
    groups[l.group] ??= { low: 0, typ: 0, high: 0 };
    for (const s of SCEN) groups[l.group][s] = r2(groups[l.group][s] + l.total[s]);
  }
  return { cls, factor: f, hours, special: sp, lines, groups, total };
}

// What failing each exam once would add (typical scenario), for the "repeat exam" hint.
export function retakeCost(input) {
  const base = compute({ ...input, theoryRetakes: 0, practicalRetakes: 0 });
  const one = compute({ ...input, theoryRetakes: 1, practicalRetakes: 1 });
  return { low: r2(one.total.low - base.total.low), typ: r2(one.total.typ - base.total.typ), high: r2(one.total.high - base.total.high) };
}
