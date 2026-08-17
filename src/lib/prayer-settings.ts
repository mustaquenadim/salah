import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PolarCircleResolution,
  type CalculationParameters,
} from 'adhan';

/**
 * The calculation method and madhab used to compute prayer times.
 *
 * These are religiously significant: they change Fajr/Isha by up to ~20 minutes
 * and Asr by up to ~70. There is no globally correct answer, so the app
 * resolves a sensible default from the user's country, surfaces that choice as
 * a caption under the prayer list, and lets the user override it.
 */

export type CalculationMethodId =
  | 'muslim-world-league'
  | 'egyptian'
  | 'karachi'
  | 'umm-al-qura'
  | 'dubai'
  | 'moonsighting-committee'
  | 'north-america'
  | 'kuwait'
  | 'qatar'
  | 'singapore'
  | 'tehran'
  | 'turkey';

export type MadhabId = 'shafi' | 'hanafi';

export type PrayerSettings = {
  methodId: CalculationMethodId;
  madhab: MadhabId;
  /** -1 | 0 | 1 -- local moon-sighting adjustment for the Hijri date. */
  hijriDayOffset: number;
  timeFormat: 'auto' | '12h' | '24h';
  /**
   * True once the user has picked a method or madhab themselves. After that,
   * moving to a new country never silently re-resolves their choice.
   */
  userOverridden: boolean;
};

type MethodDefinition = {
  label: string;
  /** Fajr/Isha angles or interval, shown as a subtitle in the picker. */
  detail: string;
  build: () => CalculationParameters;
};

export const CALCULATION_METHODS: Record<CalculationMethodId, MethodDefinition> = {
  'muslim-world-league': {
    label: 'Muslim World League',
    detail: '18° / 17°',
    build: () => CalculationMethod.MuslimWorldLeague(),
  },
  egyptian: {
    label: 'Egyptian General Authority',
    detail: '19.5° / 17.5°',
    build: () => CalculationMethod.Egyptian(),
  },
  karachi: {
    label: 'University of Islamic Sciences, Karachi',
    detail: '18° / 18°',
    build: () => CalculationMethod.Karachi(),
  },
  'umm-al-qura': {
    label: 'Umm al-Qura, Makkah',
    detail: '18.5° / 90 min after Maghrib',
    build: () => CalculationMethod.UmmAlQura(),
  },
  dubai: {
    label: 'Dubai',
    detail: '18.2° / 18.2°',
    build: () => CalculationMethod.Dubai(),
  },
  'moonsighting-committee': {
    label: 'Moonsighting Committee',
    detail: '18° / 18°, seasonal',
    build: () => CalculationMethod.MoonsightingCommittee(),
  },
  'north-america': {
    label: 'ISNA (North America)',
    detail: '15° / 15°',
    build: () => CalculationMethod.NorthAmerica(),
  },
  kuwait: {
    label: 'Kuwait',
    detail: '18° / 17.5°',
    build: () => CalculationMethod.Kuwait(),
  },
  qatar: {
    label: 'Qatar',
    detail: '18° / 90 min after Maghrib',
    build: () => CalculationMethod.Qatar(),
  },
  singapore: {
    label: 'Singapore',
    detail: '20° / 18°',
    build: () => CalculationMethod.Singapore(),
  },
  tehran: {
    label: 'Institute of Geophysics, Tehran',
    detail: '17.7° / 14°',
    build: () => CalculationMethod.Tehran(),
  },
  turkey: {
    label: 'Diyanet İşleri (Turkey)',
    detail: '18° / 17°',
    build: () => CalculationMethod.Turkey(),
  },
};

/** Order shown in the method picker -- the broad international ones first. */
export const CALCULATION_METHOD_ORDER: readonly CalculationMethodId[] = [
  'muslim-world-league',
  'north-america',
  'moonsighting-committee',
  'umm-al-qura',
  'egyptian',
  'karachi',
  'dubai',
  'kuwait',
  'qatar',
  'singapore',
  'tehran',
  'turkey',
];

export const MADHAB_LABELS: Record<MadhabId, string> = {
  // "Standard" rather than "Shafi'i" because this Asr rule is shared by the
  // Maliki, Shafi'i and Hanbali schools -- naming just one would mislead.
  shafi: 'Standard',
  hanafi: 'Hanafi',
};

/** Country -> method. Anything unlisted falls back to Muslim World League. */
const METHOD_BY_COUNTRY: Record<string, CalculationMethodId> = {
  SA: 'umm-al-qura',
  BH: 'umm-al-qura',
  OM: 'umm-al-qura',
  YE: 'umm-al-qura',
  AE: 'dubai',
  KW: 'kuwait',
  QA: 'qatar',
  EG: 'egyptian',
  SD: 'egyptian',
  LY: 'egyptian',
  SY: 'egyptian',
  LB: 'egyptian',
  JO: 'egyptian',
  PS: 'egyptian',
  IQ: 'egyptian',
  PK: 'karachi',
  IN: 'karachi',
  BD: 'karachi',
  AF: 'karachi',
  LK: 'karachi',
  NP: 'karachi',
  TR: 'turkey',
  IR: 'tehran',
  SG: 'singapore',
  MY: 'singapore',
  ID: 'singapore',
  BN: 'singapore',
  US: 'north-america',
  CA: 'north-america',
};

/**
 * Countries where the Hanafi Asr is what local masjids actually use.
 * Defaulting these to the Shafi rule would put Asr ~50 minutes early for
 * several hundred million people, which is not a defensible "safe" default.
 */
const HANAFI_COUNTRIES = new Set([
  'PK',
  'IN',
  'BD',
  'AF',
  'LK',
  'NP',
  'TR',
  'UZ',
  'KZ',
  'KG',
  'TJ',
  'TM',
  'AZ',
]);

export const DEFAULT_SETTINGS: PrayerSettings = {
  methodId: 'muslim-world-league',
  madhab: 'shafi',
  hijriDayOffset: 0,
  timeFormat: 'auto',
  userOverridden: false,
};

/**
 * Picks the method and madhab customary in `countryCode` (ISO 3166-1 alpha-2).
 *
 * Muslim World League is the fallback rather than ISNA: ISNA's 15°/15° produces
 * noticeably late Fajr and early Isha outside North America.
 */
export function resolveDefaultSettings(countryCode: string | null): PrayerSettings {
  if (!countryCode) return DEFAULT_SETTINGS;
  const code = countryCode.toUpperCase();
  return {
    ...DEFAULT_SETTINGS,
    methodId: METHOD_BY_COUNTRY[code] ?? 'muslim-world-league',
    madhab: HANAFI_COUNTRIES.has(code) ? 'hanafi' : 'shafi',
  };
}

/** `Muslim World League · Standard` -- the disclosure caption on the list. */
export function describeSettings(settings: PrayerSettings): string {
  return `${CALCULATION_METHODS[settings.methodId].label} · ${MADHAB_LABELS[settings.madhab]}`;
}

export function toCalculationParameters(
  settings: PrayerSettings,
  coordinates: Coordinates
): CalculationParameters {
  const params = (
    CALCULATION_METHODS[settings.methodId] ?? CALCULATION_METHODS['muslim-world-league']
  ).build();

  params.madhab = settings.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.recommended(coordinates);
  // Without this, adhan returns Invalid Date for Fajr/Isha above roughly 65°
  // during summer -- the whole screen would NaN out in northern Scandinavia.
  params.polarCircleResolution = PolarCircleResolution.AqrabBalad;

  return params;
}
