/**
 * Bundled offline city list -- the fallback when GPS is denied or unavailable,
 * and the source of a place name when reverse geocoding fails.
 *
 * Hand-authored rather than generated: it ships with the bundle, needs no
 * network at exactly the moment location is already failing, and works on web
 * where `reverseGeocodeAsync` does not exist at all.
 *
 * Coverage is the realistic tail -- OIC capitals, the largest Muslim-population
 * metros, the Haramayn, and the Western cities with the largest Muslim
 * communities. Someone whose exact town is missing picks the nearest entry:
 * prayer times shift about four seconds per kilometre of longitude, so being
 * 50 km off is well under a minute of error.
 */

export type City = {
  id: string;
  name: string;
  country: string;
  /** ISO 3166-1 alpha-2, used to resolve the default calculation method. */
  countryCode: string;
  latitude: number;
  longitude: number;
  /** Stored for a future timezone-aware mode; not used for formatting in v1. */
  timezone: string;
};

export const CITIES: readonly City[] = [
  // --- Arabian Peninsula ---
  { id: 'sa-makkah', name: 'Makkah', country: 'Saudi Arabia', countryCode: 'SA', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
  { id: 'sa-madinah', name: 'Madinah', country: 'Saudi Arabia', countryCode: 'SA', latitude: 24.4686, longitude: 39.6142, timezone: 'Asia/Riyadh' },
  { id: 'sa-riyadh', name: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh' },
  { id: 'sa-jeddah', name: 'Jeddah', country: 'Saudi Arabia', countryCode: 'SA', latitude: 21.4858, longitude: 39.1925, timezone: 'Asia/Riyadh' },
  { id: 'sa-dammam', name: 'Dammam', country: 'Saudi Arabia', countryCode: 'SA', latitude: 26.4207, longitude: 50.0888, timezone: 'Asia/Riyadh' },
  { id: 'ae-dubai', name: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'ae-abu-dhabi', name: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE', latitude: 24.4539, longitude: 54.3773, timezone: 'Asia/Dubai' },
  { id: 'ae-sharjah', name: 'Sharjah', country: 'United Arab Emirates', countryCode: 'AE', latitude: 25.3463, longitude: 55.4209, timezone: 'Asia/Dubai' },
  { id: 'qa-doha', name: 'Doha', country: 'Qatar', countryCode: 'QA', latitude: 25.2854, longitude: 51.531, timezone: 'Asia/Qatar' },
  { id: 'kw-kuwait-city', name: 'Kuwait City', country: 'Kuwait', countryCode: 'KW', latitude: 29.3759, longitude: 47.9774, timezone: 'Asia/Kuwait' },
  { id: 'bh-manama', name: 'Manama', country: 'Bahrain', countryCode: 'BH', latitude: 26.2285, longitude: 50.586, timezone: 'Asia/Bahrain' },
  { id: 'om-muscat', name: 'Muscat', country: 'Oman', countryCode: 'OM', latitude: 23.588, longitude: 58.3829, timezone: 'Asia/Muscat' },
  { id: 'ye-sanaa', name: 'Sanaa', country: 'Yemen', countryCode: 'YE', latitude: 15.3694, longitude: 44.191, timezone: 'Asia/Aden' },

  // --- Levant, Iraq, Iran, Turkey ---
  { id: 'iq-baghdad', name: 'Baghdad', country: 'Iraq', countryCode: 'IQ', latitude: 33.3152, longitude: 44.3661, timezone: 'Asia/Baghdad' },
  { id: 'iq-basra', name: 'Basra', country: 'Iraq', countryCode: 'IQ', latitude: 30.5085, longitude: 47.7804, timezone: 'Asia/Baghdad' },
  { id: 'iq-erbil', name: 'Erbil', country: 'Iraq', countryCode: 'IQ', latitude: 36.1901, longitude: 44.0091, timezone: 'Asia/Baghdad' },
  { id: 'jo-amman', name: 'Amman', country: 'Jordan', countryCode: 'JO', latitude: 31.9539, longitude: 35.9106, timezone: 'Asia/Amman' },
  { id: 'sy-damascus', name: 'Damascus', country: 'Syria', countryCode: 'SY', latitude: 33.5138, longitude: 36.2765, timezone: 'Asia/Damascus' },
  { id: 'sy-aleppo', name: 'Aleppo', country: 'Syria', countryCode: 'SY', latitude: 36.2021, longitude: 37.1343, timezone: 'Asia/Damascus' },
  { id: 'lb-beirut', name: 'Beirut', country: 'Lebanon', countryCode: 'LB', latitude: 33.8938, longitude: 35.5018, timezone: 'Asia/Beirut' },
  { id: 'ps-jerusalem', name: 'Jerusalem', country: 'Palestine', countryCode: 'PS', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Hebron' },
  { id: 'ps-gaza', name: 'Gaza', country: 'Palestine', countryCode: 'PS', latitude: 31.5017, longitude: 34.4668, timezone: 'Asia/Hebron' },
  { id: 'ir-tehran', name: 'Tehran', country: 'Iran', countryCode: 'IR', latitude: 35.6892, longitude: 51.389, timezone: 'Asia/Tehran' },
  { id: 'ir-mashhad', name: 'Mashhad', country: 'Iran', countryCode: 'IR', latitude: 36.2605, longitude: 59.6168, timezone: 'Asia/Tehran' },
  { id: 'tr-istanbul', name: 'Istanbul', country: 'Türkiye', countryCode: 'TR', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { id: 'tr-ankara', name: 'Ankara', country: 'Türkiye', countryCode: 'TR', latitude: 39.9334, longitude: 32.8597, timezone: 'Europe/Istanbul' },
  { id: 'tr-izmir', name: 'Izmir', country: 'Türkiye', countryCode: 'TR', latitude: 38.4237, longitude: 27.1428, timezone: 'Europe/Istanbul' },

  // --- North Africa ---
  { id: 'eg-cairo', name: 'Cairo', country: 'Egypt', countryCode: 'EG', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { id: 'eg-alexandria', name: 'Alexandria', country: 'Egypt', countryCode: 'EG', latitude: 31.2001, longitude: 29.9187, timezone: 'Africa/Cairo' },
  { id: 'eg-giza', name: 'Giza', country: 'Egypt', countryCode: 'EG', latitude: 30.0131, longitude: 31.2089, timezone: 'Africa/Cairo' },
  { id: 'sd-khartoum', name: 'Khartoum', country: 'Sudan', countryCode: 'SD', latitude: 15.5007, longitude: 32.5599, timezone: 'Africa/Khartoum' },
  { id: 'ly-tripoli', name: 'Tripoli', country: 'Libya', countryCode: 'LY', latitude: 32.8872, longitude: 13.1913, timezone: 'Africa/Tripoli' },
  { id: 'ly-benghazi', name: 'Benghazi', country: 'Libya', countryCode: 'LY', latitude: 32.1167, longitude: 20.0667, timezone: 'Africa/Tripoli' },
  { id: 'tn-tunis', name: 'Tunis', country: 'Tunisia', countryCode: 'TN', latitude: 36.8065, longitude: 10.1815, timezone: 'Africa/Tunis' },
  { id: 'dz-algiers', name: 'Algiers', country: 'Algeria', countryCode: 'DZ', latitude: 36.7538, longitude: 3.0588, timezone: 'Africa/Algiers' },
  { id: 'dz-oran', name: 'Oran', country: 'Algeria', countryCode: 'DZ', latitude: 35.6976, longitude: -0.6337, timezone: 'Africa/Algiers' },
  { id: 'ma-casablanca', name: 'Casablanca', country: 'Morocco', countryCode: 'MA', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca' },
  { id: 'ma-rabat', name: 'Rabat', country: 'Morocco', countryCode: 'MA', latitude: 34.0209, longitude: -6.8416, timezone: 'Africa/Casablanca' },
  { id: 'ma-marrakesh', name: 'Marrakesh', country: 'Morocco', countryCode: 'MA', latitude: 31.6295, longitude: -7.9811, timezone: 'Africa/Casablanca' },
  { id: 'ma-fes', name: 'Fes', country: 'Morocco', countryCode: 'MA', latitude: 34.0331, longitude: -5.0003, timezone: 'Africa/Casablanca' },
  { id: 'mr-nouakchott', name: 'Nouakchott', country: 'Mauritania', countryCode: 'MR', latitude: 18.0735, longitude: -15.9582, timezone: 'Africa/Nouakchott' },

  // --- Sub-Saharan Africa ---
  { id: 'ng-lagos', name: 'Lagos', country: 'Nigeria', countryCode: 'NG', latitude: 6.5244, longitude: 3.3792, timezone: 'Africa/Lagos' },
  { id: 'ng-kano', name: 'Kano', country: 'Nigeria', countryCode: 'NG', latitude: 12.0022, longitude: 8.592, timezone: 'Africa/Lagos' },
  { id: 'ng-abuja', name: 'Abuja', country: 'Nigeria', countryCode: 'NG', latitude: 9.0765, longitude: 7.3986, timezone: 'Africa/Lagos' },
  { id: 'sn-dakar', name: 'Dakar', country: 'Senegal', countryCode: 'SN', latitude: 14.7167, longitude: -17.4677, timezone: 'Africa/Dakar' },
  { id: 'ml-bamako', name: 'Bamako', country: 'Mali', countryCode: 'ML', latitude: 12.6392, longitude: -8.0029, timezone: 'Africa/Bamako' },
  { id: 'bf-ouagadougou', name: 'Ouagadougou', country: 'Burkina Faso', countryCode: 'BF', latitude: 12.3714, longitude: -1.5197, timezone: 'Africa/Ouagadougou' },
  { id: 'ne-niamey', name: 'Niamey', country: 'Niger', countryCode: 'NE', latitude: 13.5117, longitude: 2.1251, timezone: 'Africa/Niamey' },
  { id: 'td-ndjamena', name: "N'Djamena", country: 'Chad', countryCode: 'TD', latitude: 12.1348, longitude: 15.0557, timezone: 'Africa/Ndjamena' },
  { id: 'so-mogadishu', name: 'Mogadishu', country: 'Somalia', countryCode: 'SO', latitude: 2.0469, longitude: 45.3182, timezone: 'Africa/Mogadishu' },
  { id: 'et-addis-ababa', name: 'Addis Ababa', country: 'Ethiopia', countryCode: 'ET', latitude: 9.032, longitude: 38.7469, timezone: 'Africa/Addis_Ababa' },
  { id: 'ke-nairobi', name: 'Nairobi', country: 'Kenya', countryCode: 'KE', latitude: -1.2921, longitude: 36.8219, timezone: 'Africa/Nairobi' },
  { id: 'tz-dar-es-salaam', name: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ', latitude: -6.7924, longitude: 39.2083, timezone: 'Africa/Dar_es_Salaam' },
  { id: 'ug-kampala', name: 'Kampala', country: 'Uganda', countryCode: 'UG', latitude: 0.3476, longitude: 32.5825, timezone: 'Africa/Kampala' },
  { id: 'dj-djibouti', name: 'Djibouti', country: 'Djibouti', countryCode: 'DJ', latitude: 11.5721, longitude: 43.1456, timezone: 'Africa/Djibouti' },
  { id: 'gn-conakry', name: 'Conakry', country: 'Guinea', countryCode: 'GN', latitude: 9.6412, longitude: -13.5784, timezone: 'Africa/Conakry' },
  { id: 'sl-freetown', name: 'Freetown', country: 'Sierra Leone', countryCode: 'SL', latitude: 8.4657, longitude: -13.2317, timezone: 'Africa/Freetown' },
  { id: 'gm-banjul', name: 'Banjul', country: 'Gambia', countryCode: 'GM', latitude: 13.4549, longitude: -16.579, timezone: 'Africa/Banjul' },
  { id: 'gh-accra', name: 'Accra', country: 'Ghana', countryCode: 'GH', latitude: 5.6037, longitude: -0.187, timezone: 'Africa/Accra' },
  { id: 'ci-abidjan', name: 'Abidjan', country: "Côte d'Ivoire", countryCode: 'CI', latitude: 5.36, longitude: -4.0083, timezone: 'Africa/Abidjan' },
  { id: 'za-johannesburg', name: 'Johannesburg', country: 'South Africa', countryCode: 'ZA', latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg' },
  { id: 'za-cape-town', name: 'Cape Town', country: 'South Africa', countryCode: 'ZA', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg' },
  { id: 'za-durban', name: 'Durban', country: 'South Africa', countryCode: 'ZA', latitude: -29.8587, longitude: 31.0218, timezone: 'Africa/Johannesburg' },

  // --- South Asia ---
  { id: 'pk-karachi', name: 'Karachi', country: 'Pakistan', countryCode: 'PK', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi' },
  { id: 'pk-lahore', name: 'Lahore', country: 'Pakistan', countryCode: 'PK', latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi' },
  { id: 'pk-islamabad', name: 'Islamabad', country: 'Pakistan', countryCode: 'PK', latitude: 33.6844, longitude: 73.0479, timezone: 'Asia/Karachi' },
  { id: 'pk-rawalpindi', name: 'Rawalpindi', country: 'Pakistan', countryCode: 'PK', latitude: 33.5651, longitude: 73.0169, timezone: 'Asia/Karachi' },
  { id: 'pk-faisalabad', name: 'Faisalabad', country: 'Pakistan', countryCode: 'PK', latitude: 31.4187, longitude: 73.0791, timezone: 'Asia/Karachi' },
  { id: 'pk-peshawar', name: 'Peshawar', country: 'Pakistan', countryCode: 'PK', latitude: 34.0151, longitude: 71.5249, timezone: 'Asia/Karachi' },
  { id: 'pk-multan', name: 'Multan', country: 'Pakistan', countryCode: 'PK', latitude: 30.1575, longitude: 71.5249, timezone: 'Asia/Karachi' },
  { id: 'pk-quetta', name: 'Quetta', country: 'Pakistan', countryCode: 'PK', latitude: 30.1798, longitude: 66.975, timezone: 'Asia/Karachi' },
  { id: 'bd-dhaka', name: 'Dhaka', country: 'Bangladesh', countryCode: 'BD', latitude: 23.8103, longitude: 90.4125, timezone: 'Asia/Dhaka' },
  { id: 'bd-chittagong', name: 'Chattogram', country: 'Bangladesh', countryCode: 'BD', latitude: 22.3569, longitude: 91.7832, timezone: 'Asia/Dhaka' },
  { id: 'bd-sylhet', name: 'Sylhet', country: 'Bangladesh', countryCode: 'BD', latitude: 24.8949, longitude: 91.8687, timezone: 'Asia/Dhaka' },
  { id: 'bd-khulna', name: 'Khulna', country: 'Bangladesh', countryCode: 'BD', latitude: 22.8456, longitude: 89.5403, timezone: 'Asia/Dhaka' },
  { id: 'bd-rajshahi', name: 'Rajshahi', country: 'Bangladesh', countryCode: 'BD', latitude: 24.3745, longitude: 88.6042, timezone: 'Asia/Dhaka' },
  { id: 'in-delhi', name: 'Delhi', country: 'India', countryCode: 'IN', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' },
  { id: 'in-mumbai', name: 'Mumbai', country: 'India', countryCode: 'IN', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { id: 'in-hyderabad', name: 'Hyderabad', country: 'India', countryCode: 'IN', latitude: 17.385, longitude: 78.4867, timezone: 'Asia/Kolkata' },
  { id: 'in-kolkata', name: 'Kolkata', country: 'India', countryCode: 'IN', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { id: 'in-bengaluru', name: 'Bengaluru', country: 'India', countryCode: 'IN', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { id: 'in-chennai', name: 'Chennai', country: 'India', countryCode: 'IN', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
  { id: 'in-lucknow', name: 'Lucknow', country: 'India', countryCode: 'IN', latitude: 26.8467, longitude: 80.9462, timezone: 'Asia/Kolkata' },
  { id: 'in-ahmedabad', name: 'Ahmedabad', country: 'India', countryCode: 'IN', latitude: 23.0225, longitude: 72.5714, timezone: 'Asia/Kolkata' },
  { id: 'in-srinagar', name: 'Srinagar', country: 'India', countryCode: 'IN', latitude: 34.0837, longitude: 74.7973, timezone: 'Asia/Kolkata' },
  { id: 'af-kabul', name: 'Kabul', country: 'Afghanistan', countryCode: 'AF', latitude: 34.5553, longitude: 69.2075, timezone: 'Asia/Kabul' },
  { id: 'af-kandahar', name: 'Kandahar', country: 'Afghanistan', countryCode: 'AF', latitude: 31.6289, longitude: 65.7372, timezone: 'Asia/Kabul' },
  { id: 'af-herat', name: 'Herat', country: 'Afghanistan', countryCode: 'AF', latitude: 34.3529, longitude: 62.204, timezone: 'Asia/Kabul' },
  { id: 'lk-colombo', name: 'Colombo', country: 'Sri Lanka', countryCode: 'LK', latitude: 6.9271, longitude: 79.8612, timezone: 'Asia/Colombo' },
  { id: 'mv-male', name: 'Malé', country: 'Maldives', countryCode: 'MV', latitude: 4.1755, longitude: 73.5093, timezone: 'Indian/Maldives' },
  { id: 'np-kathmandu', name: 'Kathmandu', country: 'Nepal', countryCode: 'NP', latitude: 27.7172, longitude: 85.324, timezone: 'Asia/Kathmandu' },

  // --- Central Asia & Caucasus ---
  { id: 'uz-tashkent', name: 'Tashkent', country: 'Uzbekistan', countryCode: 'UZ', latitude: 41.2995, longitude: 69.2401, timezone: 'Asia/Tashkent' },
  { id: 'uz-samarkand', name: 'Samarkand', country: 'Uzbekistan', countryCode: 'UZ', latitude: 39.627, longitude: 66.975, timezone: 'Asia/Tashkent' },
  { id: 'kz-almaty', name: 'Almaty', country: 'Kazakhstan', countryCode: 'KZ', latitude: 43.222, longitude: 76.8512, timezone: 'Asia/Almaty' },
  { id: 'kz-astana', name: 'Astana', country: 'Kazakhstan', countryCode: 'KZ', latitude: 51.1694, longitude: 71.4491, timezone: 'Asia/Almaty' },
  { id: 'kg-bishkek', name: 'Bishkek', country: 'Kyrgyzstan', countryCode: 'KG', latitude: 42.8746, longitude: 74.5698, timezone: 'Asia/Bishkek' },
  { id: 'tj-dushanbe', name: 'Dushanbe', country: 'Tajikistan', countryCode: 'TJ', latitude: 38.5598, longitude: 68.787, timezone: 'Asia/Dushanbe' },
  { id: 'tm-ashgabat', name: 'Ashgabat', country: 'Turkmenistan', countryCode: 'TM', latitude: 37.9601, longitude: 58.3261, timezone: 'Asia/Ashgabat' },
  { id: 'az-baku', name: 'Baku', country: 'Azerbaijan', countryCode: 'AZ', latitude: 40.4093, longitude: 49.8671, timezone: 'Asia/Baku' },

  // --- Southeast & East Asia ---
  { id: 'id-jakarta', name: 'Jakarta', country: 'Indonesia', countryCode: 'ID', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { id: 'id-surabaya', name: 'Surabaya', country: 'Indonesia', countryCode: 'ID', latitude: -7.2575, longitude: 112.7521, timezone: 'Asia/Jakarta' },
  { id: 'id-bandung', name: 'Bandung', country: 'Indonesia', countryCode: 'ID', latitude: -6.9175, longitude: 107.6191, timezone: 'Asia/Jakarta' },
  { id: 'id-medan', name: 'Medan', country: 'Indonesia', countryCode: 'ID', latitude: 3.5952, longitude: 98.6722, timezone: 'Asia/Jakarta' },
  { id: 'id-makassar', name: 'Makassar', country: 'Indonesia', countryCode: 'ID', latitude: -5.1477, longitude: 119.4327, timezone: 'Asia/Makassar' },
  { id: 'my-kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', latitude: 3.139, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { id: 'my-johor-bahru', name: 'Johor Bahru', country: 'Malaysia', countryCode: 'MY', latitude: 1.4927, longitude: 103.7414, timezone: 'Asia/Kuala_Lumpur' },
  { id: 'my-george-town', name: 'George Town', country: 'Malaysia', countryCode: 'MY', latitude: 5.4141, longitude: 100.3288, timezone: 'Asia/Kuala_Lumpur' },
  { id: 'sg-singapore', name: 'Singapore', country: 'Singapore', countryCode: 'SG', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
  { id: 'bn-bandar-seri-begawan', name: 'Bandar Seri Begawan', country: 'Brunei', countryCode: 'BN', latitude: 4.9031, longitude: 114.9398, timezone: 'Asia/Brunei' },
  { id: 'ph-manila', name: 'Manila', country: 'Philippines', countryCode: 'PH', latitude: 14.5995, longitude: 120.9842, timezone: 'Asia/Manila' },
  { id: 'th-bangkok', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', latitude: 13.7563, longitude: 100.5018, timezone: 'Asia/Bangkok' },
  { id: 'cn-urumqi', name: 'Ürümqi', country: 'China', countryCode: 'CN', latitude: 43.8256, longitude: 87.6168, timezone: 'Asia/Shanghai' },
  { id: 'jp-tokyo', name: 'Tokyo', country: 'Japan', countryCode: 'JP', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { id: 'kr-seoul', name: 'Seoul', country: 'South Korea', countryCode: 'KR', latitude: 37.5665, longitude: 126.978, timezone: 'Asia/Seoul' },

  // --- Europe ---
  { id: 'gb-london', name: 'London', country: 'United Kingdom', countryCode: 'GB', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { id: 'gb-birmingham', name: 'Birmingham', country: 'United Kingdom', countryCode: 'GB', latitude: 52.4862, longitude: -1.8904, timezone: 'Europe/London' },
  { id: 'gb-manchester', name: 'Manchester', country: 'United Kingdom', countryCode: 'GB', latitude: 53.4808, longitude: -2.2426, timezone: 'Europe/London' },
  { id: 'gb-bradford', name: 'Bradford', country: 'United Kingdom', countryCode: 'GB', latitude: 53.796, longitude: -1.7594, timezone: 'Europe/London' },
  { id: 'gb-glasgow', name: 'Glasgow', country: 'United Kingdom', countryCode: 'GB', latitude: 55.8642, longitude: -4.2518, timezone: 'Europe/London' },
  { id: 'fr-paris', name: 'Paris', country: 'France', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { id: 'fr-marseille', name: 'Marseille', country: 'France', countryCode: 'FR', latitude: 43.2965, longitude: 5.3698, timezone: 'Europe/Paris' },
  { id: 'fr-lyon', name: 'Lyon', country: 'France', countryCode: 'FR', latitude: 45.764, longitude: 4.8357, timezone: 'Europe/Paris' },
  { id: 'de-berlin', name: 'Berlin', country: 'Germany', countryCode: 'DE', latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin' },
  { id: 'de-hamburg', name: 'Hamburg', country: 'Germany', countryCode: 'DE', latitude: 53.5511, longitude: 9.9937, timezone: 'Europe/Berlin' },
  { id: 'de-cologne', name: 'Cologne', country: 'Germany', countryCode: 'DE', latitude: 50.9375, longitude: 6.9603, timezone: 'Europe/Berlin' },
  { id: 'de-munich', name: 'Munich', country: 'Germany', countryCode: 'DE', latitude: 48.1351, longitude: 11.582, timezone: 'Europe/Berlin' },
  { id: 'de-frankfurt', name: 'Frankfurt', country: 'Germany', countryCode: 'DE', latitude: 50.1109, longitude: 8.6821, timezone: 'Europe/Berlin' },
  { id: 'nl-amsterdam', name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam' },
  { id: 'nl-rotterdam', name: 'Rotterdam', country: 'Netherlands', countryCode: 'NL', latitude: 51.9244, longitude: 4.4777, timezone: 'Europe/Amsterdam' },
  { id: 'be-brussels', name: 'Brussels', country: 'Belgium', countryCode: 'BE', latitude: 50.8503, longitude: 4.3517, timezone: 'Europe/Brussels' },
  { id: 'at-vienna', name: 'Vienna', country: 'Austria', countryCode: 'AT', latitude: 48.2082, longitude: 16.3738, timezone: 'Europe/Vienna' },
  { id: 'ch-zurich', name: 'Zurich', country: 'Switzerland', countryCode: 'CH', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich' },
  { id: 'se-stockholm', name: 'Stockholm', country: 'Sweden', countryCode: 'SE', latitude: 59.3293, longitude: 18.0686, timezone: 'Europe/Stockholm' },
  { id: 'no-oslo', name: 'Oslo', country: 'Norway', countryCode: 'NO', latitude: 59.9139, longitude: 10.7522, timezone: 'Europe/Oslo' },
  { id: 'dk-copenhagen', name: 'Copenhagen', country: 'Denmark', countryCode: 'DK', latitude: 55.6761, longitude: 12.5683, timezone: 'Europe/Copenhagen' },
  { id: 'es-madrid', name: 'Madrid', country: 'Spain', countryCode: 'ES', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid' },
  { id: 'es-barcelona', name: 'Barcelona', country: 'Spain', countryCode: 'ES', latitude: 41.3874, longitude: 2.1686, timezone: 'Europe/Madrid' },
  { id: 'it-rome', name: 'Rome', country: 'Italy', countryCode: 'IT', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome' },
  { id: 'it-milan', name: 'Milan', country: 'Italy', countryCode: 'IT', latitude: 45.4642, longitude: 9.19, timezone: 'Europe/Rome' },
  { id: 'ru-moscow', name: 'Moscow', country: 'Russia', countryCode: 'RU', latitude: 55.7558, longitude: 37.6173, timezone: 'Europe/Moscow' },
  { id: 'ru-kazan', name: 'Kazan', country: 'Russia', countryCode: 'RU', latitude: 55.8304, longitude: 49.0661, timezone: 'Europe/Moscow' },
  { id: 'ba-sarajevo', name: 'Sarajevo', country: 'Bosnia and Herzegovina', countryCode: 'BA', latitude: 43.8563, longitude: 18.4131, timezone: 'Europe/Sarajevo' },
  { id: 'xk-pristina', name: 'Pristina', country: 'Kosovo', countryCode: 'XK', latitude: 42.6629, longitude: 21.1655, timezone: 'Europe/Belgrade' },
  { id: 'al-tirana', name: 'Tirana', country: 'Albania', countryCode: 'AL', latitude: 41.3275, longitude: 19.8187, timezone: 'Europe/Tirane' },

  // --- Americas ---
  { id: 'us-new-york', name: 'New York', country: 'United States', countryCode: 'US', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  { id: 'us-chicago', name: 'Chicago', country: 'United States', countryCode: 'US', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago' },
  { id: 'us-dearborn', name: 'Dearborn', country: 'United States', countryCode: 'US', latitude: 42.3223, longitude: -83.1763, timezone: 'America/Detroit' },
  { id: 'us-detroit', name: 'Detroit', country: 'United States', countryCode: 'US', latitude: 42.3314, longitude: -83.0458, timezone: 'America/Detroit' },
  { id: 'us-philadelphia', name: 'Philadelphia', country: 'United States', countryCode: 'US', latitude: 39.9526, longitude: -75.1652, timezone: 'America/New_York' },
  { id: 'us-washington', name: 'Washington, D.C.', country: 'United States', countryCode: 'US', latitude: 38.9072, longitude: -77.0369, timezone: 'America/New_York' },
  { id: 'us-atlanta', name: 'Atlanta', country: 'United States', countryCode: 'US', latitude: 33.749, longitude: -84.388, timezone: 'America/New_York' },
  { id: 'us-houston', name: 'Houston', country: 'United States', countryCode: 'US', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago' },
  { id: 'us-dallas', name: 'Dallas', country: 'United States', countryCode: 'US', latitude: 32.7767, longitude: -96.797, timezone: 'America/Chicago' },
  { id: 'us-minneapolis', name: 'Minneapolis', country: 'United States', countryCode: 'US', latitude: 44.9778, longitude: -93.265, timezone: 'America/Chicago' },
  { id: 'us-los-angeles', name: 'Los Angeles', country: 'United States', countryCode: 'US', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  { id: 'ca-toronto', name: 'Toronto', country: 'Canada', countryCode: 'CA', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
  { id: 'ca-montreal', name: 'Montreal', country: 'Canada', countryCode: 'CA', latitude: 45.5017, longitude: -73.5673, timezone: 'America/Toronto' },
  { id: 'ca-ottawa', name: 'Ottawa', country: 'Canada', countryCode: 'CA', latitude: 45.4215, longitude: -75.6972, timezone: 'America/Toronto' },
  { id: 'ca-calgary', name: 'Calgary', country: 'Canada', countryCode: 'CA', latitude: 51.0447, longitude: -114.0719, timezone: 'America/Edmonton' },
  { id: 'ca-vancouver', name: 'Vancouver', country: 'Canada', countryCode: 'CA', latitude: 49.2827, longitude: -123.1207, timezone: 'America/Vancouver' },
  { id: 'br-sao-paulo', name: 'São Paulo', country: 'Brazil', countryCode: 'BR', latitude: -23.5505, longitude: -46.6333, timezone: 'America/Sao_Paulo' },
  { id: 'ar-buenos-aires', name: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', latitude: -34.6037, longitude: -58.3816, timezone: 'America/Argentina/Buenos_Aires' },

  // --- Oceania ---
  { id: 'au-sydney', name: 'Sydney', country: 'Australia', countryCode: 'AU', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { id: 'au-melbourne', name: 'Melbourne', country: 'Australia', countryCode: 'AU', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne' },
  { id: 'au-perth', name: 'Perth', country: 'Australia', countryCode: 'AU', latitude: -31.9505, longitude: 115.8605, timezone: 'Australia/Perth' },
  { id: 'nz-auckland', name: 'Auckland', country: 'New Zealand', countryCode: 'NZ', latitude: -36.8485, longitude: 174.7633, timezone: 'Pacific/Auckland' },
];

/**
 * Strips diacritics so "Male" matches "Malé" and "Urumqi" matches "Ürümqi".
 *
 * Decomposes and then drops the combining marks by code point rather than with
 * a character-class regex, which keeps the source ASCII-safe and avoids relying
 * on Unicode property escapes in Hermes.
 */
function normalizeAscii(value: string): string {
  let out = '';
  for (const char of value.normalize('NFD')) {
    const code = char.charCodeAt(0);
    // U+0300..U+036F -- combining diacritical marks.
    if (code >= 0x0300 && code <= 0x036f) continue;
    out += char;
  }
  return out.toLowerCase().trim();
}

/**
 * Matches on city or country, preferring prefix matches so typing "ka" surfaces
 * Karachi and Kabul before Dhaka.
 */
export function searchCities(query: string, limit = 40): City[] {
  const term = normalizeAscii(query);
  if (!term) return CITIES.slice(0, limit);

  const prefix: City[] = [];
  const contains: City[] = [];

  for (const city of CITIES) {
    const name = normalizeAscii(city.name);
    if (name.startsWith(term)) {
      prefix.push(city);
    } else if (name.includes(term) || normalizeAscii(city.country).includes(term)) {
      contains.push(city);
    }
  }

  return [...prefix, ...contains].slice(0, limit);
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Closest bundled city to a coordinate. Does double duty: the offline label
 * when reverse geocoding fails, and the country code that picks the default
 * calculation method when reverse geocoding never succeeds at all.
 */
export function nearestCity(latitude: number, longitude: number): City | null {
  let best: City | null = null;
  let bestDistance = Infinity;

  for (const city of CITIES) {
    const distance = distanceKm({ latitude, longitude }, city);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = city;
    }
  }

  return best;
}
