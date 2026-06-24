// This file provides utility functions for handling country data

interface Country {
  code: string;
  phonePrefix?: string;
}

/**
 * Get a localized country name for an ISO 3166-1 alpha-2 code using Intl.DisplayNames.
 * Falls back to the code itself if the locale/API is unavailable.
 */
export function getLocalizedCountryName(code: string, locale?: string): string {
  if (!code) return '';
  try {
    const displayNames = new Intl.DisplayNames([locale ?? 'en'], { type: 'region' });
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function getCountryNameFromCode(code: string, locale?: string): string {
  return getLocalizedCountryName(code, locale);
}

/**
 * Get flag emoji for a country code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode) return '';

  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

/**
 * Get the flag emoji for a phone prefix (e.g. "+34" → 🇪🇸).
 * Returns the flag of the first matching country, or empty string.
 */
export function getFlagFromPhonePrefix(prefix: string): string {
  const country = countries.find(c => c.phonePrefix === prefix);
  return country ? getCountryFlag(country.code) : '';
}

// Static list of countries (ISO 3166-1 alpha-2 codes + phone prefixes).
// Display names come from Intl.DisplayNames via getLocalizedCountryName.
export const countries: Country[] = [
  { code: 'AF', phonePrefix: '+93' },
  { code: 'AL', phonePrefix: '+355' },
  { code: 'DZ', phonePrefix: '+213' },
  { code: 'AD', phonePrefix: '+376' },
  { code: 'AO', phonePrefix: '+244' },
  { code: 'AG', phonePrefix: '+1' },
  { code: 'AR', phonePrefix: '+54' },
  { code: 'AM', phonePrefix: '+374' },
  { code: 'AU', phonePrefix: '+61' },
  { code: 'AT', phonePrefix: '+43' },
  { code: 'AZ', phonePrefix: '+994' },
  { code: 'BS', phonePrefix: '+1' },
  { code: 'BH', phonePrefix: '+973' },
  { code: 'BD', phonePrefix: '+880' },
  { code: 'BB', phonePrefix: '+1' },
  { code: 'BY', phonePrefix: '+375' },
  { code: 'BE', phonePrefix: '+32' },
  { code: 'BZ', phonePrefix: '+501' },
  { code: 'BJ', phonePrefix: '+229' },
  { code: 'BT', phonePrefix: '+975' },
  { code: 'BO', phonePrefix: '+591' },
  { code: 'BA', phonePrefix: '+387' },
  { code: 'BW', phonePrefix: '+267' },
  { code: 'BR', phonePrefix: '+55' },
  { code: 'BN', phonePrefix: '+673' },
  { code: 'BG', phonePrefix: '+359' },
  { code: 'BF', phonePrefix: '+226' },
  { code: 'BI', phonePrefix: '+257' },
  { code: 'CV', phonePrefix: '+238' },
  { code: 'KH', phonePrefix: '+855' },
  { code: 'CM', phonePrefix: '+237' },
  { code: 'CA', phonePrefix: '+1' },
  { code: 'CF', phonePrefix: '+236' },
  { code: 'TD', phonePrefix: '+235' },
  { code: 'CL', phonePrefix: '+56' },
  { code: 'CN', phonePrefix: '+86' },
  { code: 'CO', phonePrefix: '+57' },
  { code: 'KM', phonePrefix: '+269' },
  { code: 'CG', phonePrefix: '+242' },
  { code: 'CR', phonePrefix: '+506' },
  { code: 'HR', phonePrefix: '+385' },
  { code: 'CU', phonePrefix: '+53' },
  { code: 'CY', phonePrefix: '+357' },
  { code: 'CZ', phonePrefix: '+420' },
  { code: 'DK', phonePrefix: '+45' },
  { code: 'DJ', phonePrefix: '+253' },
  { code: 'DM', phonePrefix: '+1' },
  { code: 'DO', phonePrefix: '+1' },
  { code: 'EC', phonePrefix: '+593' },
  { code: 'EG', phonePrefix: '+20' },
  { code: 'SV', phonePrefix: '+503' },
  { code: 'GQ', phonePrefix: '+240' },
  { code: 'ER', phonePrefix: '+291' },
  { code: 'EE', phonePrefix: '+372' },
  { code: 'SZ', phonePrefix: '+268' },
  { code: 'ET', phonePrefix: '+251' },
  { code: 'FJ', phonePrefix: '+679' },
  { code: 'FI', phonePrefix: '+358' },
  { code: 'FR', phonePrefix: '+33' },
  { code: 'GA', phonePrefix: '+241' },
  { code: 'GM', phonePrefix: '+220' },
  { code: 'GE', phonePrefix: '+995' },
  { code: 'DE', phonePrefix: '+49' },
  { code: 'GH', phonePrefix: '+233' },
  { code: 'GR', phonePrefix: '+30' },
  { code: 'GD', phonePrefix: '+1' },
  { code: 'GT', phonePrefix: '+502' },
  { code: 'GN', phonePrefix: '+224' },
  { code: 'GW', phonePrefix: '+245' },
  { code: 'GY', phonePrefix: '+592' },
  { code: 'HT', phonePrefix: '+509' },
  { code: 'HN', phonePrefix: '+504' },
  { code: 'HU', phonePrefix: '+36' },
  { code: 'IS', phonePrefix: '+354' },
  { code: 'IN', phonePrefix: '+91' },
  { code: 'ID', phonePrefix: '+62' },
  { code: 'IR', phonePrefix: '+98' },
  { code: 'IQ', phonePrefix: '+964' },
  { code: 'IE', phonePrefix: '+353' },
  { code: 'IL', phonePrefix: '+972' },
  { code: 'IT', phonePrefix: '+39' },
  { code: 'JM', phonePrefix: '+1' },
  { code: 'JP', phonePrefix: '+81' },
  { code: 'JO', phonePrefix: '+962' },
  { code: 'KZ', phonePrefix: '+7' },
  { code: 'KE', phonePrefix: '+254' },
  { code: 'KI', phonePrefix: '+686' },
  { code: 'KP', phonePrefix: '+850' },
  { code: 'KR', phonePrefix: '+82' },
  { code: 'KW', phonePrefix: '+965' },
  { code: 'KG', phonePrefix: '+996' },
  { code: 'LA', phonePrefix: '+856' },
  { code: 'LV', phonePrefix: '+371' },
  { code: 'LB', phonePrefix: '+961' },
  { code: 'LS', phonePrefix: '+266' },
  { code: 'LR', phonePrefix: '+231' },
  { code: 'LY', phonePrefix: '+218' },
  { code: 'LI', phonePrefix: '+423' },
  { code: 'LT', phonePrefix: '+370' },
  { code: 'LU', phonePrefix: '+352' },
  { code: 'MG', phonePrefix: '+261' },
  { code: 'MW', phonePrefix: '+265' },
  { code: 'MY', phonePrefix: '+60' },
  { code: 'MV', phonePrefix: '+960' },
  { code: 'ML', phonePrefix: '+223' },
  { code: 'MT', phonePrefix: '+356' },
  { code: 'MH', phonePrefix: '+692' },
  { code: 'MR', phonePrefix: '+222' },
  { code: 'MU', phonePrefix: '+230' },
  { code: 'MX', phonePrefix: '+52' },
  { code: 'FM', phonePrefix: '+691' },
  { code: 'MD', phonePrefix: '+373' },
  { code: 'MC', phonePrefix: '+377' },
  { code: 'MN', phonePrefix: '+976' },
  { code: 'ME', phonePrefix: '+382' },
  { code: 'MA', phonePrefix: '+212' },
  { code: 'MZ', phonePrefix: '+258' },
  { code: 'MM', phonePrefix: '+95' },
  { code: 'NA', phonePrefix: '+264' },
  { code: 'NR', phonePrefix: '+674' },
  { code: 'NP', phonePrefix: '+977' },
  { code: 'NL', phonePrefix: '+31' },
  { code: 'NZ', phonePrefix: '+64' },
  { code: 'NI', phonePrefix: '+505' },
  { code: 'NE', phonePrefix: '+227' },
  { code: 'NG', phonePrefix: '+234' },
  { code: 'MK', phonePrefix: '+389' },
  { code: 'NO', phonePrefix: '+47' },
  { code: 'OM', phonePrefix: '+968' },
  { code: 'PK', phonePrefix: '+92' },
  { code: 'PW', phonePrefix: '+680' },
  { code: 'PA', phonePrefix: '+507' },
  { code: 'PG', phonePrefix: '+675' },
  { code: 'PY', phonePrefix: '+595' },
  { code: 'PE', phonePrefix: '+51' },
  { code: 'PH', phonePrefix: '+63' },
  { code: 'PL', phonePrefix: '+48' },
  { code: 'PT', phonePrefix: '+351' },
  { code: 'QA', phonePrefix: '+974' },
  { code: 'RO', phonePrefix: '+40' },
  { code: 'RU', phonePrefix: '+7' },
  { code: 'RW', phonePrefix: '+250' },
  { code: 'KN', phonePrefix: '+1' },
  { code: 'LC', phonePrefix: '+1' },
  { code: 'VC', phonePrefix: '+1' },
  { code: 'WS', phonePrefix: '+685' },
  { code: 'SM', phonePrefix: '+378' },
  { code: 'ST', phonePrefix: '+239' },
  { code: 'SA', phonePrefix: '+966' },
  { code: 'SN', phonePrefix: '+221' },
  { code: 'RS', phonePrefix: '+381' },
  { code: 'SC', phonePrefix: '+248' },
  { code: 'SL', phonePrefix: '+232' },
  { code: 'SG', phonePrefix: '+65' },
  { code: 'SK', phonePrefix: '+421' },
  { code: 'SI', phonePrefix: '+386' },
  { code: 'SB', phonePrefix: '+677' },
  { code: 'SO', phonePrefix: '+252' },
  { code: 'ZA', phonePrefix: '+27' },
  { code: 'SS', phonePrefix: '+211' },
  { code: 'ES', phonePrefix: '+34' },
  { code: 'LK', phonePrefix: '+94' },
  { code: 'SD', phonePrefix: '+249' },
  { code: 'SR', phonePrefix: '+597' },
  { code: 'SE', phonePrefix: '+46' },
  { code: 'CH', phonePrefix: '+41' },
  { code: 'SY', phonePrefix: '+963' },
  { code: 'TW', phonePrefix: '+886' },
  { code: 'TJ', phonePrefix: '+992' },
  { code: 'TZ', phonePrefix: '+255' },
  { code: 'TH', phonePrefix: '+66' },
  { code: 'TL', phonePrefix: '+670' },
  { code: 'TG', phonePrefix: '+228' },
  { code: 'TO', phonePrefix: '+676' },
  { code: 'TT', phonePrefix: '+1' },
  { code: 'TN', phonePrefix: '+216' },
  { code: 'TR', phonePrefix: '+90' },
  { code: 'TM', phonePrefix: '+993' },
  { code: 'TV', phonePrefix: '+688' },
  { code: 'UG', phonePrefix: '+256' },
  { code: 'UA', phonePrefix: '+380' },
  { code: 'AE', phonePrefix: '+971' },
  { code: 'GB', phonePrefix: '+44' },
  { code: 'US', phonePrefix: '+1' },
  { code: 'UY', phonePrefix: '+598' },
  { code: 'UZ', phonePrefix: '+998' },
  { code: 'VU', phonePrefix: '+678' },
  { code: 'VA', phonePrefix: '+379' },
  { code: 'VE', phonePrefix: '+58' },
  { code: 'VN', phonePrefix: '+84' },
  { code: 'YE', phonePrefix: '+967' },
  { code: 'ZM', phonePrefix: '+260' },
  { code: 'ZW', phonePrefix: '+263' }
];
