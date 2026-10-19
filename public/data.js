// Every figure the calculator uses, in one place.
// OFFICIAL = fixed by law (GebOSt, FahrschAusbO), with source. Everything else is an ESTIMATE of market prices
// (low / typical / high) and labelled as such in the app. Checked 2026-10-19. Update once a year.
// Amounts in EUR incl. 19 % VAT.

export const CHECKED = '2026-10-19';

// Links in the top strip. '' = same host (hosted on hmsk.life). Self-hosted copies point to hmsk.life.
export const LINK_BASE = 'https://hmsk.life';

export const SOURCES = {
  gebost: 'https://www.gesetze-im-internet.de/stgebo_2011/anlage.html',
  tuevFees: 'https://www.tuev-hessen.de/324/gebuehren-entgelte-und-auslagen-fuer-fahrerlaubnispruefungen/',
  fahrschAusbO: 'https://www.gesetze-im-internet.de/fahrschausbo_2012/anlage_4.html',
  bmvReform: 'https://www.bmv.de/SharedDocs/DE/Pressemitteilungen/2026/043-schnieder-bezahlbarer-fuehrerschein.html',
  brReform: 'https://www.bundesrat.de/SharedDocs/drucksachen/2026/0301-0400/330-26(B).pdf?__blob=publicationFile&v=1',
  fev: 'https://www.gesetze-im-internet.de/fev_2010/',
};

// Official exam fees (GebOSt Anlage, Nr. 402 ff.), gross incl. 19 % VAT, valid since 31 Jan 2024
// (published fee table of TÜV Hessen; TÜV and DEKRA charge the same statutory amounts nationwide).
export const OFFICIAL = {
  theory: 24.99,            // PC theory exam, all classes, per attempt
  mofaExam: 26.54,          // Mofa test incl. Prüfbescheinigung (§ 5 FeV)
  mofaRetake: 17.26,        // Mofa repeat test
  practicalB: 129.83,       // classes B, BE, AM (B197 is a class B test in an automatic)
  practicalA: 162.67,       // classes A1, A2, A
};

// Minimum special drives (45 min each), Anlage 4 FahrschAusbO, first licence without Vorbesitz.
// The 2026 reform drops the fixed numbers (only the kinds of drive stay required); not in force yet.
export const SPECIAL = {
  B: { rural: 5, motorway: 4, night: 3 },
  B197: { rural: 5, motorway: 4, night: 3 },
  BE: { rural: 3, motorway: 1, night: 1 },   // "B auf BE"
  A1: { rural: 5, motorway: 4, night: 3 },
  A2: { rural: 5, motorway: 4, night: 3 },
  A: { rural: 5, motorway: 4, night: 3 },
  AM: { rural: 0, motorway: 0, night: 0 },
  Mofa: { rural: 0, motorway: 0, night: 0 },
};

export const CLASSES = ['B', 'B197', 'BE', 'A1', 'A2', 'A', 'AM', 'Mofa'];

// What each class needs. theoryExam: PC theory at TÜV/DEKRA. practical: fee for the practical test (0 = none).
// firstAid/eyeTest: needed for a first licence (BE builds on B, which already has them). office: application at
// the Führerscheinstelle. testDrive: B197 Schaltkompetenz test drive (15 min) at the driving school.
export const RULES = {
  B: { theoryExam: true, practical: 'practicalB', firstAid: true, eyeTest: true, office: true, testDrive: false },
  B197: { theoryExam: true, practical: 'practicalB', firstAid: true, eyeTest: true, office: true, testDrive: true },
  BE: { theoryExam: false, practical: 'practicalB', firstAid: false, eyeTest: false, office: true, testDrive: false },
  A1: { theoryExam: true, practical: 'practicalA', firstAid: true, eyeTest: true, office: true, testDrive: false },
  A2: { theoryExam: true, practical: 'practicalA', firstAid: true, eyeTest: true, office: true, testDrive: false },
  A: { theoryExam: true, practical: 'practicalA', firstAid: true, eyeTest: true, office: true, testDrive: false },
  AM: { theoryExam: true, practical: 'practicalB', firstAid: true, eyeTest: true, office: true, testDrive: false },
  Mofa: { theoryExam: true, practical: null, firstAid: false, eyeTest: false, office: false, testDrive: false },
};

// ESTIMATES: driving school prices [low, typical, high] for a mid-sized town, national average level.
// Compiled from published 2025/2026 price lists and consumer guides (ADAC, Wirtschaftswoche, driving school
// price lists). Rounded. They are not official and vary a lot between schools.
const E = (low, typ, high) => ({ low, typ, high });
export const PRICES = {
  B: { base: E(250, 380, 550), material: E(50, 80, 120), lesson: E(55, 65, 85), special: E(65, 75, 100), presentTheory: E(0, 40, 80), presentPractical: E(135, 200, 295), hours: E(18, 25, 45) },
  B197: { base: E(250, 390, 560), material: E(50, 80, 120), lesson: E(55, 65, 85), special: E(65, 75, 100), presentTheory: E(0, 40, 80), presentPractical: E(135, 200, 295), hours: E(18, 24, 40), testDrive: E(30, 50, 80) },
  BE: { base: E(150, 250, 350), material: E(0, 30, 60), lesson: E(60, 75, 95), special: E(70, 85, 105), presentTheory: E(0, 0, 0), presentPractical: E(135, 190, 280), hours: E(3, 6, 10) },
  A1: { base: E(250, 380, 500), material: E(40, 70, 100), lesson: E(60, 75, 95), special: E(70, 85, 105), presentTheory: E(0, 40, 80), presentPractical: E(150, 220, 320), hours: E(8, 14, 24) },
  A2: { base: E(250, 380, 500), material: E(40, 70, 100), lesson: E(60, 75, 95), special: E(70, 85, 105), presentTheory: E(0, 40, 80), presentPractical: E(150, 220, 320), hours: E(8, 14, 24) },
  A: { base: E(250, 380, 500), material: E(40, 70, 100), lesson: E(62, 78, 98), special: E(72, 88, 110), presentTheory: E(0, 40, 80), presentPractical: E(150, 220, 320), hours: E(10, 16, 26) },
  AM: { base: E(200, 300, 420), material: E(40, 60, 90), lesson: E(50, 62, 80), special: E(0, 0, 0), presentTheory: E(0, 40, 80), presentPractical: E(120, 170, 250), hours: E(4, 8, 12) },
  Mofa: { base: E(100, 160, 230), material: E(20, 35, 50), lesson: E(45, 55, 70), special: E(0, 0, 0), presentTheory: E(0, 25, 50), presentPractical: E(0, 0, 0), hours: E(1, 1, 2) },
};

// ESTIMATES outside the driving school.
export const OTHER = {
  office: E(38, 44, 60),     // Führerscheinstelle: GebOSt 202.1 + 202.x add up to about 40.80; offices charge 38 to 70 incl. card
  eyeTest: E(0, 6.43, 15),   // 6.43 was the former GebOSt fee; many opticians still charge it, some test for free
  firstAid: E(40, 55, 75),   // Erste-Hilfe-Kurs, 9 Unterrichtseinheiten
  photo: E(10, 15, 20),      // biometric passport photo
};

// ESTIMATE: price level of driving schools by Bundesland and town size, relative to the national average.
// Applies only to driving school prices, never to official fees.
export const STATES = {
  BW: ['Baden-Württemberg', 1.05], BY: ['Bayern', 1.06], BE: ['Berlin', 1.04], BB: ['Brandenburg', 0.93],
  HB: ['Bremen', 1.0], HH: ['Hamburg', 1.07], HE: ['Hessen', 1.03], MV: ['Mecklenburg-Vorpommern', 0.92],
  NI: ['Niedersachsen', 0.98], NW: ['Nordrhein-Westfalen', 1.0], RP: ['Rheinland-Pfalz', 0.99], SL: ['Saarland', 0.98],
  SN: ['Sachsen', 0.92], ST: ['Sachsen-Anhalt', 0.91], SH: ['Schleswig-Holstein', 0.99], TH: ['Thüringen', 0.92],
};
export const TOWN = { rural: 0.94, small: 0.98, medium: 1.0, large: 1.07 };

// Repeat exams: extra lessons a school usually asks for before a second practical test (estimate).
export const RETAKE_LESSONS = E(1, 3, 5);
