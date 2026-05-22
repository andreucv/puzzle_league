// This file provides utility functions for handling country data

interface Country {
  name: string;
  code: string;
  flag?: string;
  phonePrefix?: string;
}

/**
 * Returns a list of countries with their codes
 */
export async function getCountries(): Promise<Country[]> {
  try {
    // You can replace this with an API call if you want to fetch from a service
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

/**
 * Format a country name for display
 */
export function formatCountryName(name: string): string {
  return name;
}

/**
 * Get a localized country name for an ISO 3166-1 alpha-2 code using Intl.DisplayNames.
 * Falls back to the hardcoded English name (or the code itself) if the locale/API is unavailable.
 */
export function getLocalizedCountryName(code: string, locale?: string): string {
  if (!code) return '';
  try {
    const displayNames = new Intl.DisplayNames([locale ?? 'en'], { type: 'region' });
    return displayNames.of(code) ?? getCountryNameFromCode(code);
  } catch {
    return getCountryNameFromCode(code);
  }
}

export function getCountryNameFromCode(code: string, locale?: string): string {
  if (locale) return getLocalizedCountryName(code, locale);
  const country = countries.find(c => c.code === code);
  return country ? country.name : code;
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

// Static list of countries - can be replaced with API call
export const countries: Country[] = [
  { name: 'Afghanistan', code: 'AF', phonePrefix: '+93' },
  { name: 'Albania', code: 'AL', phonePrefix: '+355' },
  { name: 'Algeria', code: 'DZ', phonePrefix: '+213' },
  { name: 'Andorra', code: 'AD', phonePrefix: '+376' },
  { name: 'Angola', code: 'AO', phonePrefix: '+244' },
  { name: 'Antigua and Barbuda', code: 'AG', phonePrefix: '+1' },
  { name: 'Argentina', code: 'AR', phonePrefix: '+54' },
  { name: 'Armenia', code: 'AM', phonePrefix: '+374' },
  { name: 'Australia', code: 'AU', phonePrefix: '+61' },
  { name: 'Austria', code: 'AT', phonePrefix: '+43' },
  { name: 'Azerbaijan', code: 'AZ', phonePrefix: '+994' },
  { name: 'Bahamas', code: 'BS', phonePrefix: '+1' },
  { name: 'Bahrain', code: 'BH', phonePrefix: '+973' },
  { name: 'Bangladesh', code: 'BD', phonePrefix: '+880' },
  { name: 'Barbados', code: 'BB', phonePrefix: '+1' },
  { name: 'Belarus', code: 'BY', phonePrefix: '+375' },
  { name: 'Belgium', code: 'BE', phonePrefix: '+32' },
  { name: 'Belize', code: 'BZ', phonePrefix: '+501' },
  { name: 'Benin', code: 'BJ', phonePrefix: '+229' },
  { name: 'Bhutan', code: 'BT', phonePrefix: '+975' },
  { name: 'Bolivia', code: 'BO', phonePrefix: '+591' },
  { name: 'Bosnia and Herzegovina', code: 'BA', phonePrefix: '+387' },
  { name: 'Botswana', code: 'BW', phonePrefix: '+267' },
  { name: 'Brazil', code: 'BR', phonePrefix: '+55' },
  { name: 'Brunei', code: 'BN', phonePrefix: '+673' },
  { name: 'Bulgaria', code: 'BG', phonePrefix: '+359' },
  { name: 'Burkina Faso', code: 'BF', phonePrefix: '+226' },
  { name: 'Burundi', code: 'BI', phonePrefix: '+257' },
  { name: 'Cabo Verde', code: 'CV', phonePrefix: '+238' },
  { name: 'Cambodia', code: 'KH', phonePrefix: '+855' },
  { name: 'Cameroon', code: 'CM', phonePrefix: '+237' },
  { name: 'Canada', code: 'CA', phonePrefix: '+1' },
  { name: 'Central African Republic', code: 'CF', phonePrefix: '+236' },
  { name: 'Chad', code: 'TD', phonePrefix: '+235' },
  { name: 'Chile', code: 'CL', phonePrefix: '+56' },
  { name: 'China', code: 'CN', phonePrefix: '+86' },
  { name: 'Colombia', code: 'CO', phonePrefix: '+57' },
  { name: 'Comoros', code: 'KM', phonePrefix: '+269' },
  { name: 'Congo', code: 'CG', phonePrefix: '+242' },
  { name: 'Costa Rica', code: 'CR', phonePrefix: '+506' },
  { name: 'Croatia', code: 'HR', phonePrefix: '+385' },
  { name: 'Cuba', code: 'CU', phonePrefix: '+53' },
  { name: 'Cyprus', code: 'CY', phonePrefix: '+357' },
  { name: 'Czech Republic', code: 'CZ', phonePrefix: '+420' },
  { name: 'Denmark', code: 'DK', phonePrefix: '+45' },
  { name: 'Djibouti', code: 'DJ', phonePrefix: '+253' },
  { name: 'Dominica', code: 'DM', phonePrefix: '+1' },
  { name: 'Dominican Republic', code: 'DO', phonePrefix: '+1' },
  { name: 'Ecuador', code: 'EC', phonePrefix: '+593' },
  { name: 'Egypt', code: 'EG', phonePrefix: '+20' },
  { name: 'El Salvador', code: 'SV', phonePrefix: '+503' },
  { name: 'Equatorial Guinea', code: 'GQ', phonePrefix: '+240' },
  { name: 'Eritrea', code: 'ER', phonePrefix: '+291' },
  { name: 'Estonia', code: 'EE', phonePrefix: '+372' },
  { name: 'Eswatini', code: 'SZ', phonePrefix: '+268' },
  { name: 'Ethiopia', code: 'ET', phonePrefix: '+251' },
  { name: 'Fiji', code: 'FJ', phonePrefix: '+679' },
  { name: 'Finland', code: 'FI', phonePrefix: '+358' },
  { name: 'France', code: 'FR', phonePrefix: '+33' },
  { name: 'Gabon', code: 'GA', phonePrefix: '+241' },
  { name: 'Gambia', code: 'GM', phonePrefix: '+220' },
  { name: 'Georgia', code: 'GE', phonePrefix: '+995' },
  { name: 'Germany', code: 'DE', phonePrefix: '+49' },
  { name: 'Ghana', code: 'GH', phonePrefix: '+233' },
  { name: 'Greece', code: 'GR', phonePrefix: '+30' },
  { name: 'Grenada', code: 'GD', phonePrefix: '+1' },
  { name: 'Guatemala', code: 'GT', phonePrefix: '+502' },
  { name: 'Guinea', code: 'GN', phonePrefix: '+224' },
  { name: 'Guinea-Bissau', code: 'GW', phonePrefix: '+245' },
  { name: 'Guyana', code: 'GY', phonePrefix: '+592' },
  { name: 'Haiti', code: 'HT', phonePrefix: '+509' },
  { name: 'Honduras', code: 'HN', phonePrefix: '+504' },
  { name: 'Hungary', code: 'HU', phonePrefix: '+36' },
  { name: 'Iceland', code: 'IS', phonePrefix: '+354' },
  { name: 'India', code: 'IN', phonePrefix: '+91' },
  { name: 'Indonesia', code: 'ID', phonePrefix: '+62' },
  { name: 'Iran', code: 'IR', phonePrefix: '+98' },
  { name: 'Iraq', code: 'IQ', phonePrefix: '+964' },
  { name: 'Ireland', code: 'IE', phonePrefix: '+353' },
  { name: 'Israel', code: 'IL', phonePrefix: '+972' },
  { name: 'Italy', code: 'IT', phonePrefix: '+39' },
  { name: 'Jamaica', code: 'JM', phonePrefix: '+1' },
  { name: 'Japan', code: 'JP', phonePrefix: '+81' },
  { name: 'Jordan', code: 'JO', phonePrefix: '+962' },
  { name: 'Kazakhstan', code: 'KZ', phonePrefix: '+7' },
  { name: 'Kenya', code: 'KE', phonePrefix: '+254' },
  { name: 'Kiribati', code: 'KI', phonePrefix: '+686' },
  { name: 'Korea, North', code: 'KP', phonePrefix: '+850' },
  { name: 'Korea, South', code: 'KR', phonePrefix: '+82' },
  { name: 'Kuwait', code: 'KW', phonePrefix: '+965' },
  { name: 'Kyrgyzstan', code: 'KG', phonePrefix: '+996' },
  { name: 'Laos', code: 'LA', phonePrefix: '+856' },
  { name: 'Latvia', code: 'LV', phonePrefix: '+371' },
  { name: 'Lebanon', code: 'LB', phonePrefix: '+961' },
  { name: 'Lesotho', code: 'LS', phonePrefix: '+266' },
  { name: 'Liberia', code: 'LR', phonePrefix: '+231' },
  { name: 'Libya', code: 'LY', phonePrefix: '+218' },
  { name: 'Liechtenstein', code: 'LI', phonePrefix: '+423' },
  { name: 'Lithuania', code: 'LT', phonePrefix: '+370' },
  { name: 'Luxembourg', code: 'LU', phonePrefix: '+352' },
  { name: 'Madagascar', code: 'MG', phonePrefix: '+261' },
  { name: 'Malawi', code: 'MW', phonePrefix: '+265' },
  { name: 'Malaysia', code: 'MY', phonePrefix: '+60' },
  { name: 'Maldives', code: 'MV', phonePrefix: '+960' },
  { name: 'Mali', code: 'ML', phonePrefix: '+223' },
  { name: 'Malta', code: 'MT', phonePrefix: '+356' },
  { name: 'Marshall Islands', code: 'MH', phonePrefix: '+692' },
  { name: 'Mauritania', code: 'MR', phonePrefix: '+222' },
  { name: 'Mauritius', code: 'MU', phonePrefix: '+230' },
  { name: 'Mexico', code: 'MX', phonePrefix: '+52' },
  { name: 'Micronesia', code: 'FM', phonePrefix: '+691' },
  { name: 'Moldova', code: 'MD', phonePrefix: '+373' },
  { name: 'Monaco', code: 'MC', phonePrefix: '+377' },
  { name: 'Mongolia', code: 'MN', phonePrefix: '+976' },
  { name: 'Montenegro', code: 'ME', phonePrefix: '+382' },
  { name: 'Morocco', code: 'MA', phonePrefix: '+212' },
  { name: 'Mozambique', code: 'MZ', phonePrefix: '+258' },
  { name: 'Myanmar', code: 'MM', phonePrefix: '+95' },
  { name: 'Namibia', code: 'NA', phonePrefix: '+264' },
  { name: 'Nauru', code: 'NR', phonePrefix: '+674' },
  { name: 'Nepal', code: 'NP', phonePrefix: '+977' },
  { name: 'Netherlands', code: 'NL', phonePrefix: '+31' },
  { name: 'New Zealand', code: 'NZ', phonePrefix: '+64' },
  { name: 'Nicaragua', code: 'NI', phonePrefix: '+505' },
  { name: 'Niger', code: 'NE', phonePrefix: '+227' },
  { name: 'Nigeria', code: 'NG', phonePrefix: '+234' },
  { name: 'North Macedonia', code: 'MK', phonePrefix: '+389' },
  { name: 'Norway', code: 'NO', phonePrefix: '+47' },
  { name: 'Oman', code: 'OM', phonePrefix: '+968' },
  { name: 'Pakistan', code: 'PK', phonePrefix: '+92' },
  { name: 'Palau', code: 'PW', phonePrefix: '+680' },
  { name: 'Panama', code: 'PA', phonePrefix: '+507' },
  { name: 'Papua New Guinea', code: 'PG', phonePrefix: '+675' },
  { name: 'Paraguay', code: 'PY', phonePrefix: '+595' },
  { name: 'Peru', code: 'PE', phonePrefix: '+51' },
  { name: 'Philippines', code: 'PH', phonePrefix: '+63' },
  { name: 'Poland', code: 'PL', phonePrefix: '+48' },
  { name: 'Portugal', code: 'PT', phonePrefix: '+351' },
  { name: 'Qatar', code: 'QA', phonePrefix: '+974' },
  { name: 'Romania', code: 'RO', phonePrefix: '+40' },
  { name: 'Russia', code: 'RU', phonePrefix: '+7' },
  { name: 'Rwanda', code: 'RW', phonePrefix: '+250' },
  { name: 'Saint Kitts and Nevis', code: 'KN', phonePrefix: '+1' },
  { name: 'Saint Lucia', code: 'LC', phonePrefix: '+1' },
  { name: 'Saint Vincent and the Grenadines', code: 'VC', phonePrefix: '+1' },
  { name: 'Samoa', code: 'WS', phonePrefix: '+685' },
  { name: 'San Marino', code: 'SM', phonePrefix: '+378' },
  { name: 'Sao Tome and Principe', code: 'ST', phonePrefix: '+239' },
  { name: 'Saudi Arabia', code: 'SA', phonePrefix: '+966' },
  { name: 'Senegal', code: 'SN', phonePrefix: '+221' },
  { name: 'Serbia', code: 'RS', phonePrefix: '+381' },
  { name: 'Seychelles', code: 'SC', phonePrefix: '+248' },
  { name: 'Sierra Leone', code: 'SL', phonePrefix: '+232' },
  { name: 'Singapore', code: 'SG', phonePrefix: '+65' },
  { name: 'Slovakia', code: 'SK', phonePrefix: '+421' },
  { name: 'Slovenia', code: 'SI', phonePrefix: '+386' },
  { name: 'Solomon Islands', code: 'SB', phonePrefix: '+677' },
  { name: 'Somalia', code: 'SO', phonePrefix: '+252' },
  { name: 'South Africa', code: 'ZA', phonePrefix: '+27' },
  { name: 'South Sudan', code: 'SS', phonePrefix: '+211' },
  { name: 'Spain', code: 'ES', phonePrefix: '+34' },
  { name: 'Sri Lanka', code: 'LK', phonePrefix: '+94' },
  { name: 'Sudan', code: 'SD', phonePrefix: '+249' },
  { name: 'Suriname', code: 'SR', phonePrefix: '+597' },
  { name: 'Sweden', code: 'SE', phonePrefix: '+46' },
  { name: 'Switzerland', code: 'CH', phonePrefix: '+41' },
  { name: 'Syria', code: 'SY', phonePrefix: '+963' },
  { name: 'Taiwan', code: 'TW', phonePrefix: '+886' },
  { name: 'Tajikistan', code: 'TJ', phonePrefix: '+992' },
  { name: 'Tanzania', code: 'TZ', phonePrefix: '+255' },
  { name: 'Thailand', code: 'TH', phonePrefix: '+66' },
  { name: 'Timor-Leste', code: 'TL', phonePrefix: '+670' },
  { name: 'Togo', code: 'TG', phonePrefix: '+228' },
  { name: 'Tonga', code: 'TO', phonePrefix: '+676' },
  { name: 'Trinidad and Tobago', code: 'TT', phonePrefix: '+1' },
  { name: 'Tunisia', code: 'TN', phonePrefix: '+216' },
  { name: 'Turkey', code: 'TR', phonePrefix: '+90' },
  { name: 'Turkmenistan', code: 'TM', phonePrefix: '+993' },
  { name: 'Tuvalu', code: 'TV', phonePrefix: '+688' },
  { name: 'Uganda', code: 'UG', phonePrefix: '+256' },
  { name: 'Ukraine', code: 'UA', phonePrefix: '+380' },
  { name: 'United Arab Emirates', code: 'AE', phonePrefix: '+971' },
  { name: 'United Kingdom', code: 'GB', phonePrefix: '+44' },
  { name: 'United States', code: 'US', phonePrefix: '+1' },
  { name: 'Uruguay', code: 'UY', phonePrefix: '+598' },
  { name: 'Uzbekistan', code: 'UZ', phonePrefix: '+998' },
  { name: 'Vanuatu', code: 'VU', phonePrefix: '+678' },
  { name: 'Vatican City', code: 'VA', phonePrefix: '+379' },
  { name: 'Venezuela', code: 'VE', phonePrefix: '+58' },
  { name: 'Vietnam', code: 'VN', phonePrefix: '+84' },
  { name: 'Yemen', code: 'YE', phonePrefix: '+967' },
  { name: 'Zambia', code: 'ZM', phonePrefix: '+260' },
  { name: 'Zimbabwe', code: 'ZW', phonePrefix: '+263' }
];
