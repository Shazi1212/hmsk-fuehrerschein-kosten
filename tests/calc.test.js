import test from 'node:test';
import assert from 'node:assert/strict';
import { compute, retakeCost, priceFactor, specialCounts } from '../public/calc.js';
import { OFFICIAL, CLASSES } from '../public/data.js';

const line = (r, key) => r.lines.find(l => l.key === key);

test('class B, national average level: totals worked out by hand', () => {
  const r = compute({ cls: 'B', state: 'NW', town: 'medium' });
  // low: 250 + 50 + 18*55 + 12*65 + 0 + 135 + 24.99 + 129.83 + 38 + 0 + 40 + 10
  assert.equal(r.total.low, 2447.82);
  // typ: 380 + 80 + 25*65 + 12*75 + 40 + 200 + 24.99 + 129.83 + 44 + 6.43 + 55 + 15
  assert.equal(r.total.typ, 3500.25);
  // high: 550 + 120 + 45*85 + 12*100 + 80 + 295 + 24.99 + 129.83 + 60 + 15 + 75 + 20
  assert.equal(r.total.high, 6394.82);
  assert.equal(r.special.total, 12);
  assert.ok(r.total.low < r.total.typ && r.total.typ < r.total.high);
});

test('official fees: GebOSt amounts, never scaled by region', () => {
  const r = compute({ cls: 'B', state: 'ST', town: 'rural' });
  assert.equal(line(r, 'theoryFee').unit.typ, 24.99);
  assert.equal(line(r, 'practicalFee').unit.typ, 129.83);
  assert.equal(line(compute({ cls: 'A' }), 'practicalFee').unit.typ, OFFICIAL.practicalA);
  assert.equal(line(compute({ cls: 'AM' }), 'practicalFee').unit.typ, 129.83);
});

test('regional factor scales driving school prices only', () => {
  const f = priceFactor('SN', 'rural');
  assert.equal(Math.round(f * 10000) / 10000, 0.8648);
  const r = compute({ cls: 'B', state: 'SN', town: 'rural' });
  assert.equal(line(r, 'base').unit.typ, Math.round(380 * f * 100) / 100);
  assert.equal(line(r, 'office').unit.typ, 44);
});

test('own quote overrides the estimate in every scenario', () => {
  const r = compute({ cls: 'B', hours: 30, overrides: { lesson: 70, base: 0 } });
  const l = line(r, 'lesson');
  assert.deepEqual(l.total, { low: 2100, typ: 2100, high: 2100 });
  assert.equal(l.overridden, true);
  assert.deepEqual(line(r, 'base').total, { low: 0, typ: 0, high: 0 });
});

test('BE: no theory exam, no first aid or eye test, 3/1/1 special drives', () => {
  const r = compute({ cls: 'BE' });
  for (const k of ['theoryFee', 'presentTheory', 'firstAid', 'eyeTest']) assert.equal(line(r, k), undefined, k);
  assert.deepEqual([r.special.rural, r.special.motorway, r.special.night], [3, 1, 1]);
});

test('Mofa: Prüfbescheinigung test only, no practical test, no Führerscheinstelle', () => {
  const r = compute({ cls: 'Mofa' });
  assert.equal(line(r, 'theoryFee').unit.typ, 26.54);
  for (const k of ['practicalFee', 'presentPractical', 'office', 'special']) assert.equal(line(r, k), undefined, k);
});

test('B197 has the Schaltkompetenz test drive', () => {
  assert.ok(line(compute({ cls: 'B197' }), 'testDrive'));
  assert.equal(line(compute({ cls: 'B' }), 'testDrive'), undefined);
});

test('repeat exams: one failed theory and one failed practical test', () => {
  const input = { cls: 'B', state: 'NW', town: 'medium' };
  // typ: (24.99 + 40) + (129.83 + 200 + 3 * 65)
  assert.equal(retakeCost(input).typ, 589.82);
  const r = compute({ ...input, theoryRetakes: 2, practicalRetakes: 1, retakeLessons: 0 });
  assert.equal(line(r, 'theoryRetake').total.typ, 129.98);
  assert.equal(line(r, 'practicalRetake').total.typ, 329.83);
});

test('special drives can be set lower (reform scenario) and first aid skipped', () => {
  const sp = specialCounts({ cls: 'B', special: { rural: 0, motorway: 0, night: 0 } });
  assert.equal(sp.total, 0);
  const r = compute({ cls: 'B', special: { rural: 0, motorway: 0, night: 0 }, haveFirstAid: true });
  assert.equal(line(r, 'special'), undefined);
  assert.equal(line(r, 'firstAid'), undefined);
});

test('every class computes without NaN', () => {
  for (const cls of CLASSES) {
    const r = compute({ cls, theoryRetakes: 1, practicalRetakes: 1 });
    for (const s of ['low', 'typ', 'high']) assert.ok(Number.isFinite(r.total[s]) && r.total[s] > 0, cls + s);
  }
});
