import { CalendarDate, IslamicUmalquraCalendar, toCalendar } from '@internationalized/date';

import { addDays } from '@/lib/date-format';

/**
 * Hijri (Umm al-Qura) conversion.
 *
 * `@internationalized/date` implements the Umm al-Qura month-length tables in
 * pure JavaScript -- no ICU, no `Intl` -- so iOS, Android and web always agree.
 * See the note in `date-format.ts` for why that matters here.
 *
 * The month names are ours (below) rather than locale data, for the same reason.
 */

export type HijriDate = {
  year: number;
  /** 1-indexed, matching {@link HIJRI_MONTHS_EN}. */
  month: number;
  day: number;
};

export const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabiʿ al-Awwal',
  'Rabiʿ al-Thani',
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  'Shaʿban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qaʿdah',
  'Dhu al-Hijjah',
] as const;

/**
 * Converts a local civil date to Umm al-Qura.
 *
 * `dayOffset` (-1 | 0 | +1) is the local moon-sighting adjustment that nearly
 * every prayer app eventually needs -- calendars in different countries can
 * legitimately differ by a day from the calculated Umm al-Qura date.
 *
 * Note this rolls over at midnight, not at Maghrib. Maghrib-rollover is
 * arguably the more correct Islamic reckoning, but it surprises users who
 * cross-check the app against a printed wall calendar, so v1 keeps midnight.
 */
export function toHijri(date: Date, dayOffset = 0): HijriDate {
  const shifted = dayOffset === 0 ? date : addDays(date, dayOffset);
  const gregorian = new CalendarDate(
    shifted.getFullYear(),
    shifted.getMonth() + 1,
    shifted.getDate()
  );
  const hijri = toCalendar(gregorian, new IslamicUmalquraCalendar());
  return { year: hijri.year, month: hijri.month, day: hijri.day };
}

/** `4 Rabiʿ al-Awwal 1448`. */
export function formatHijri(date: Date, dayOffset = 0): string {
  const { year, month, day } = toHijri(date, dayOffset);
  return `${day} ${HIJRI_MONTHS_EN[month - 1]} ${year}`;
}
