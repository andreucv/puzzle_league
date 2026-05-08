import type { EmailTranslation } from './email_translations';

const BASE_URL = 'https://puzzligas.com'; // Used for absolute CTA links

/**
 * Build a simple branded HTML email for a single language.
 */
export function buildSingleLanguageEmail(
	translation: EmailTranslation,
	link: string,
): string {
	const absoluteLink = link.startsWith('http') ? link : `${BASE_URL}${link}`;
	return wrapInLayout(sectionHtml(translation, absoluteLink));
}

/**
 * Build a multi-language HTML email (ca → es → en) with dividers.
 * Used when the recipient has no stored locale preference.
 */
export function buildMultiLanguageEmail(
	translations: EmailTranslation[],
	link: string,
): string {
	const absoluteLink = link.startsWith('http') ? link : `${BASE_URL}${link}`;
	const sections = translations
		.map((t, i) => {
			const divider = i < translations.length - 1
				? '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />'
				: '';
			return sectionHtml(t, absoluteLink) + divider;
		})
		.join('');
	return wrapInLayout(sections);
}

function sectionHtml(translation: EmailTranslation, absoluteLink: string): string {
	return `
    <p style="font-size:12px;color:#9ca3af;margin:0 0 4px 0;">${translation.languageName}</p>
    <h2 style="font-size:20px;font-weight:600;color:#111827;margin:0 0 12px 0;">${escapeHtml(translation.title)}</h2>
    <p style="font-size:16px;color:#374151;line-height:1.5;margin:0 0 20px 0;">${escapeHtml(translation.message).replace(/\n/g, '<br>')}</p>
    <a href="${escapeHtml(absoluteLink)}"
       style="display:inline-block;padding:10px 24px;background-color:#6366f1;color:#ffffff;
              text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
      ${translation.buttonText ?? (translation.locale === 'ca' ? 'Veure detalls' : translation.locale === 'es' ? 'Ver detalles' : 'View details')}
    </a>`;
}

function wrapInLayout(body: string): string {
	return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="padding:24px 32px;">
      ${body}
    </div>
    <div style="padding:16px 32px;background-color:#f9fafb;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">Puzzle League</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
