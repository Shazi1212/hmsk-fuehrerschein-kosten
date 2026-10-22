import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEmbed, cityRegion, embedSource, creditUrl } from '../public/embed-params.js';

test('embed defaults: class B, NRW, mid-sized town, German, no school', () => {
  const p = parseEmbed('');
  assert.deepEqual([p.lang, p.cls, p.state, p.town, p.hours, p.city, p.school, p.hasSchoolPrices], ['de', 'B', 'NW', 'medium', null, '', '', false]);
});

test('city prefills the region; explicit state/town win; unknown city keeps the default', () => {
  assert.deepEqual(cityRegion('München'), ['BY', 'large']);
  assert.deepEqual(cityRegion('Frankfurt am Main'), ['HE', 'large']);
  assert.deepEqual(cityRegion('Halle (Saale)'), ['ST', 'large']);
  assert.equal(cityRegion('Essenbach'), null);
  const p = parseEmbed('?city=K%C3%B6ln');
  assert.deepEqual([p.city, p.state, p.town], ['Köln', 'NW', 'large']);
  const q = parseEmbed('?city=K%C3%B6ln&state=BY&town=rural');
  assert.deepEqual([q.state, q.town], ['BY', 'rural']);
  const u = parseEmbed('?city=Kleinkleckersdorf');
  assert.deepEqual([u.city, u.state, u.town], ['Kleinkleckersdorf', 'NW', 'medium']);
});

test('school name shows only with its own prices; prices accept German number format', () => {
  assert.equal(parseEmbed('?school=Fahrschule%20Muster').school, '');
  const p = parseEmbed('?school=Fahrschule%20Muster&lesson=57,50&base=1.250,00&special=x&exam=99');
  assert.equal(p.school, 'Fahrschule Muster');
  assert.deepEqual(p.overrides, { base: 1250, lesson: 57.5 });
  assert.equal(p.hasSchoolPrices, true);
  assert.deepEqual(parseEmbed('?lesson=99999').overrides, {});
});

test('free text is cleaned and capped', () => {
  const p = parseEmbed('?city=%3Cscript%3EBerlin%0A&school=' + 'A'.repeat(100) + '&lesson=60');
  assert.equal(p.city, 'scriptBerlin');
  assert.equal(p.school.length, 60);
});

test('class, hours and language parameters', () => {
  const p = parseEmbed('?cls=A2&hours=20&lang=en');
  assert.deepEqual([p.cls, p.hours, p.lang], ['A2', 20, 'en']);
  assert.equal(parseEmbed('?cls=Z&hours=-3').cls, 'B');
  assert.equal(parseEmbed('?hours=500').hours, null);
});

test('credit link: UTM with the embedding host, else embed', () => {
  assert.equal(embedSource('https://www.fahrschule-muster.de/preise/'), 'fahrschule-muster.de');
  assert.equal(embedSource(''), 'embed');
  assert.equal(embedSource('file:///tmp/x.html'), 'embed');
  assert.equal(embedSource('https://hmsk.life/de/tools/fuehrerschein-kosten/'), 'embed');
  assert.equal(creditUrl('https://blog.example.org/a', '/de/tools/fuehrerschein-kosten/'),
    'https://hmsk.life/de/tools/fuehrerschein-kosten/?utm_source=blog.example.org&utm_medium=widget&utm_campaign=fuehrerschein-widget');
  assert.equal(creditUrl('', '/apps/fuehrerschein-kosten/', '#cls=B', { lang: 'de' }),
    'https://hmsk.life/apps/fuehrerschein-kosten/?lang=de&utm_source=embed&utm_medium=widget&utm_campaign=fuehrerschein-widget#cls=B');
});
