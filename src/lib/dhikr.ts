import { Platform, type TextStyle } from 'react-native';

/**
 * Bundled adhkar for the tasbih counter.
 *
 * Hand-authored and shipped with the bundle, in the same spirit as
 * `cities.ts`: dhikr is what someone reaches for on a train with no signal, and
 * a counter that needs a network call before it can name what it is counting
 * has missed the point.
 *
 * Scope is the everyday set -- the tasbih after salah, the tahlil, istighfar,
 * salawat, and the short remembrances with a well-known count -- rather than a
 * full adhkar compendium. Anything with a disputed wording or count is left
 * out; this is a counter, not a reference work.
 *
 * `defaultTarget` is the traditional count where one exists (33/33/34 after
 * salah, 100 for the tahlil and istighfar) and 100 otherwise, which is the
 * usual round figure. It is only a starting point -- the user can change the
 * target on any dhikr, and once they do, picking another dhikr no longer
 * overrides it.
 */

export type Dhikr = {
  id: string;
  /** Fully vocalised, so it reads correctly at a glance. */
  arabic: string;
  transliteration: string;
  translation: string;
  /** Adopted as the target on selection, unless the user set one by hand. */
  defaultTarget: number;
};

export const ADHKAR: readonly Dhikr[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ ٱللَّٰهِ',
    transliteration: 'SubhanAllah',
    translation: 'Glory be to Allah',
    defaultTarget: 33,
  },
  {
    id: 'alhamdulillah',
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
    transliteration: 'Alhamdulillah',
    translation: 'All praise is due to Allah',
    defaultTarget: 33,
  },
  {
    id: 'allahu-akbar',
    arabic: 'ٱللَّٰهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest',
    defaultTarget: 34,
  },
  {
    id: 'la-ilaha-illallah',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
    transliteration: 'La ilaha illa Allah',
    translation: 'There is no god but Allah',
    defaultTarget: 100,
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ',
    transliteration: 'Astaghfirullah',
    translation: 'I seek forgiveness from Allah',
    defaultTarget: 100,
  },
  {
    id: 'astaghfirullah-wa-atubu-ilayh',
    arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullaha wa atubu ilayh',
    translation: 'I seek forgiveness from Allah and turn to Him in repentance',
    defaultTarget: 100,
  },
  {
    id: 'subhanallahi-wa-bihamdihi',
    arabic: 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ',
    transliteration: 'SubhanAllahi wa bihamdih',
    translation: 'Glory be to Allah and praise be to Him',
    defaultTarget: 100,
  },
  {
    id: 'subhanallahil-azeem',
    arabic: 'سُبْحَانَ ٱللَّٰهِ ٱلْعَظِيمِ',
    transliteration: 'SubhanAllahil ‘Azeem',
    translation: 'Glory be to Allah, the Most Great',
    defaultTarget: 100,
  },
  {
    id: 'la-hawla',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    translation: 'There is no power nor might except by Allah',
    defaultTarget: 100,
  },
  {
    id: 'salawat',
    arabic: 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    transliteration: 'Allahumma salli ‘ala Muhammad',
    translation: 'O Allah, send blessings upon Muhammad',
    defaultTarget: 100,
  },
  {
    id: 'hasbunallah',
    arabic: 'حَسْبُنَا ٱللَّٰهُ وَنِعْمَ ٱلْوَكِيلُ',
    transliteration: 'Hasbunallahu wa ni‘mal wakeel',
    translation: 'Allah is sufficient for us, and He is the best disposer of affairs',
    defaultTarget: 100,
  },
  {
    id: 'ya-hayyu-ya-qayyum',
    arabic: 'يَا حَيُّ يَا قَيُّومُ',
    transliteration: 'Ya Hayyu Ya Qayyum',
    translation: 'O Ever-Living, O Sustainer of all',
    defaultTarget: 100,
  },
  {
    id: 'la-ilaha-illa-anta',
    arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ ٱلظَّالِمِينَ',
    transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimeen',
    translation: 'There is no god but You; glory be to You. I have surely been among the wrongdoers',
    defaultTarget: 100,
  },
  {
    id: 'rabbi-zidni-ilma',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidni ‘ilma',
    translation: 'My Lord, increase me in knowledge',
    defaultTarget: 100,
  },
  {
    id: 'bismillah',
    arabic: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    transliteration: 'Bismillahir-Rahmanir-Raheem',
    translation: 'In the name of Allah, the Most Merciful, the Most Compassionate',
    defaultTarget: 100,
  },
] as const;

const BY_ID = new Map(ADHKAR.map((dhikr) => [dhikr.id, dhikr]));

/** Null for an unknown id -- a stale stored id must read as "none selected". */
export function findDhikr(id: string): Dhikr | null {
  return BY_ID.get(id) ?? null;
}

/**
 * Style for any Arabic line.
 *
 * Geist is Latin-only, and `ui/text.tsx` puts `font-sans` on every `Text`, so
 * an Arabic string inherits a family that cannot draw it. iOS falls back per
 * glyph, but Android draws tofu, so the family has to be cleared explicitly.
 * Applied as an inline style rather than a class because a class cannot unset
 * `fontFamily` -- and inline wins over the class-derived style.
 *
 * `sans-serif` on Android is Roboto, whose system fallback chain covers Arabic;
 * `undefined` on iOS resolves to San Francisco, which hands off to SF Arabic.
 *
 * Line height is set well above the Latin ratio: vocalised Arabic stacks
 * diacritics above and below the baseline, and at the default leading the
 * marks of one line collide with the next.
 */
export const ARABIC_TEXT: TextStyle = {
  fontFamily: Platform.select({ android: 'sans-serif', default: undefined }),
  writingDirection: 'rtl',
  lineHeight: 46,
};
