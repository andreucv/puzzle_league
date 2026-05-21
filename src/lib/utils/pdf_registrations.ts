import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
import { getCategoryTypeName } from '$lib/utils/category_utils';

interface PdfEntry {
	id: string;
	status: string;
	tableNumber: number | null;
	createdAt: string | Date;
	confirmedAt: string | Date | null;
	users: { name: string }[];
	externalParticipants: { name: string }[];
}

interface PdfCategory {
	type: CategoryType;
	subname: string | null;
	entries: PdfEntry[];
}

interface PdfParams {
	competitionName: string;
	categories: PdfCategory[];
	translate: (key: string, params?: Record<string, string | number>) => string;
	locale: string;
}

function formatDate(date: string | Date | null, locale: string): string {
	if (!date) return '';
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(date));
}

function getParticipantNames(entry: PdfEntry): string {
	const userNames = entry.users.map((u) => u.name);
	const externalNames = entry.externalParticipants.map((p) => p.name);
	return [...userNames, ...externalNames].join(', ');
}

function getStatusLabel(status: string, translate: PdfParams['translate']): string {
	const statusKeys: Record<string, string> = {
		CONFIRMED: 'manage_registrations.confirmed',
		PENDING_CONFIRMATION: 'manage_registrations.pending_confirmation',
		WAITLISTED: 'manage_registrations.waitlisted'
	};
	return translate(statusKeys[status] ?? status);
}

export function downloadRegistrationsPdf({ competitionName, categories, translate, locale }: PdfParams) {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();

	// Title: competition name
	doc.setFontSize(18);
	doc.text(competitionName, pageWidth / 2, 20, { align: 'center' });

	// Subtitle: download date/time
	const now = formatDate(new Date(), locale);
	doc.setFontSize(10);
	doc.text(translate('manage_registrations.pdf_generated_at', { date: now }), pageWidth / 2, 28, {
		align: 'center'
	});

	let startY = 36;

	const columnHeaders = [
		translate('manage_registrations.pdf_check_in'),
		translate('manage_registrations.pdf_table'),
		translate('manage_registrations.pdf_participants'),
		translate('manage_registrations.pdf_registration_date'),
		translate('manage_registrations.pdf_status'),
		translate('manage_registrations.pdf_confirmed_date')
	];

	for (const category of categories) {
		// Category name header
		const categoryLabel = translate(getCategoryTypeName(category.type));
		const categoryTitle =
			category.subname && category.subname !== getCategoryTypeName(category.type).toUpperCase()
				? `${categoryLabel} — ${category.subname}`
				: categoryLabel;

		// Check if we need a new page (leave room for header + at least one row)
		if (startY > doc.internal.pageSize.getHeight() - 40) {
			doc.addPage();
			startY = 20;
		}

		doc.setFontSize(13);
		doc.text(categoryTitle, 14, startY);
		startY += 4;

		const rows = category.entries.map((entry) => [
			'', // Empty check-in column
			entry.tableNumber != null ? String(entry.tableNumber) : '',
			getParticipantNames(entry),
			formatDate(entry.createdAt, locale),
			getStatusLabel(entry.status, translate),
			formatDate(entry.confirmedAt, locale)
		]);

		autoTable(doc, {
			startY,
			head: [columnHeaders],
			body: rows,
			theme: 'grid',
			headStyles: { fillColor: [60, 60, 60], fontSize: 8 },
			bodyStyles: { fontSize: 8 },
			columnStyles: {
				0: { cellWidth: 16 }, // Check-in (narrow)
				1: { cellWidth: 14 }, // Table (narrow)
				2: { cellWidth: 'auto' }, // Participants (expand)
				3: { cellWidth: 30 }, // Registration date
				4: { cellWidth: 26 }, // Status
				5: { cellWidth: 30 } // Confirmed date
			},
			margin: { left: 14, right: 14 }
		});

		// Get Y position after the table for next category
		startY = (doc as any).lastAutoTable.finalY + 12;
	}

	// Sanitize filename
	const safeName = competitionName.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
	const dateStr = new Date().toISOString().slice(0, 10);
	doc.save(`${safeName}_registrations_${dateStr}.pdf`);
}
