import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { CategoryType } from '$prisma/browser';
import { getCategoryTypeName } from '$lib/utils/category_utils';

interface CardEntry {
	id: string;
	status: string;
	tableNumber: number | null;
	users: { name: string }[];
	externalParticipants: { name: string }[];
	entryTag?: { tag: string; status: string } | null;
}

interface CardCategory {
	type: CategoryType;
	subname: string | null;
	entries: CardEntry[];
}

interface CardsPdfParams {
	competitionName: string;
	categories: CardCategory[];
	/** Origin used to build the QR target, e.g. window.location.origin */
	origin: string;
	translate: (key: string, params?: Record<string, string | number>) => string;
}

// A4 portrait, mm
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const CARD_W = PAGE_W - 2 * MARGIN;
const PAD = 5;
const HEADER_H = 14; // competition name (bold) + category line
const TABLE_LABEL_H = 5; // "Table" copy above the number box
const TABLE_BOX = 26;
const QR_SIZE = 32;
const NAME_LINE_H = 8;
const TAG_H = 8;
const CARD_GAP = 8; // room for the dashed cut line between cards
const CONTENT_H = PAGE_H - 2 * MARGIN;

/** Entries that get a card: confirmed with a published table, sorted by table number. */
export function qualifyingEntries(entries: CardEntry[]): CardEntry[] {
	return entries
		.filter((e) => e.status === 'CONFIRMED' && e.tableNumber != null)
		.sort((a, b) => (a.tableNumber as number) - (b.tableNumber as number));
}

function participantNames(entry: CardEntry): string[] {
	return [...entry.users.map((u) => u.name), ...entry.externalParticipants.map((p) => p.name)];
}

function confirmedTag(entry: CardEntry): string | null {
	return entry.entryTag?.status === 'CONFIRMED' ? entry.entryTag.tag : null;
}

/** Card height in mm: base chrome + one line per participant (+ tag badge). Cards are atomic. */
export function cardHeight(entry: CardEntry): number {
	const namesBlock =
		participantNames(entry).length * NAME_LINE_H + (confirmedTag(entry) ? TAG_H : 0);
	const contentBlock = Math.max(TABLE_LABEL_H + TABLE_BOX, QR_SIZE, namesBlock);
	return PAD + HEADER_H + contentBlock + PAD;
}

/**
 * Packs card heights into pages of `contentHeight`, never splitting a card.
 * Returns pages as arrays of card indices. A card taller than a page still
 * gets its own page (drawn clipped) rather than looping forever.
 */
export function paginateCards(heights: number[], contentHeight: number, gap: number): number[][] {
	const pages: number[][] = [];
	let current: number[] = [];
	let used = 0;
	heights.forEach((h, i) => {
		const needed = current.length === 0 ? h : gap + h;
		if (current.length > 0 && used + needed > contentHeight) {
			pages.push(current);
			current = [i];
			used = h;
		} else {
			current.push(i);
			used += needed;
		}
	});
	if (current.length > 0) pages.push(current);
	return pages;
}

function categoryLabel(category: CardCategory, translate: CardsPdfParams['translate']): string {
	const label = translate(getCategoryTypeName(category.type));
	return category.subname && category.subname !== getCategoryTypeName(category.type).toUpperCase()
		? `${label} — ${category.subname}`
		: label;
}

function drawCard(
	doc: jsPDF,
	y: number,
	entry: CardEntry,
	competitionName: string,
	categoryText: string,
	tableLabel: string,
	qrDataUrl: string
): void {
	const h = cardHeight(entry);
	const x = MARGIN;

	doc.setLineDashPattern([], 0);
	doc.setDrawColor(140);
	doc.roundedRect(x, y, CARD_W, h, 2, 2);

	// Header: competition name (dominant) with the category right below
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(14);
	doc.setTextColor(0);
	doc.text(competitionName, x + PAD, y + PAD + 4, { maxWidth: CARD_W - 2 * PAD });
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10.5);
	doc.setTextColor(110);
	doc.text(categoryText, x + PAD, y + PAD + 10, { maxWidth: CARD_W - 2 * PAD });
	doc.setTextColor(0);

	const contentY = y + PAD + HEADER_H;

	// Table number: "Table" copy above the boxed number, readable from standing height
	doc.setFontSize(8.5);
	doc.setTextColor(110);
	doc.text(tableLabel.toUpperCase(), x + PAD + TABLE_BOX / 2, contentY + 3, { align: 'center' });
	doc.setTextColor(0);
	doc.setDrawColor(0);
	doc.rect(x + PAD, contentY + TABLE_LABEL_H, TABLE_BOX, TABLE_BOX);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(28);
	doc.text(
		String(entry.tableNumber),
		x + PAD + TABLE_BOX / 2,
		contentY + TABLE_LABEL_H + TABLE_BOX / 2 + 3.5,
		{ align: 'center' }
	);

	// Participants, one per line, vertically centered against the table block
	const namesX = x + PAD + TABLE_BOX + 8;
	const namesMaxW = CARD_W - 2 * PAD - TABLE_BOX - 8 - QR_SIZE - 4;
	const names = participantNames(entry);
	const tag = confirmedTag(entry);
	const namesBlockH = names.length * NAME_LINE_H + (tag ? TAG_H : 0);
	const tableBlockH = TABLE_LABEL_H + TABLE_BOX;
	const namesY = contentY + Math.max(0, (tableBlockH - namesBlockH) / 2);
	doc.setFontSize(13);
	names.forEach((name, i) => {
		doc.text(name, namesX, namesY + 6 + i * NAME_LINE_H, { maxWidth: namesMaxW });
	});
	doc.setFont('helvetica', 'normal');

	// Confirmed-tag badge below the names
	if (tag) {
		const badgeY = namesY + 2.5 + names.length * NAME_LINE_H;
		doc.setFontSize(9);
		const badgeW = doc.getTextWidth(tag) + 4;
		doc.setFillColor(230, 230, 230);
		doc.roundedRect(namesX, badgeY, badgeW, 5.5, 1.5, 1.5, 'F');
		doc.text(tag, namesX + 2, badgeY + 4);
	}

	// QR on the right
	doc.addImage(qrDataUrl, 'PNG', x + CARD_W - PAD - QR_SIZE, contentY, QR_SIZE, QR_SIZE);
}

function drawCutLine(doc: jsPDF, y: number): void {
	doc.setDrawColor(170);
	doc.setLineDashPattern([3, 2], 0);
	doc.line(MARGIN, y, PAGE_W - MARGIN, y);
	doc.setLineDashPattern([], 0);
}

/**
 * Generates a per-entry cut-out card PDF for every qualifying entry
 * (CONFIRMED + published table). Categories without qualifying entries are
 * skipped; each category starts on a fresh page. QR encodes `<origin>/e/<entryId>`.
 */
export async function downloadEntryCardsPdf({
	competitionName,
	categories,
	origin,
	translate
}: CardsPdfParams): Promise<void> {
	const printable = categories
		.map((category) => ({ category, cards: qualifyingEntries(category.entries) }))
		.filter(({ cards }) => cards.length > 0);
	if (printable.length === 0) return;

	// Pre-render all QR codes before touching the document
	const qrByEntryId = new Map<string, string>(
		await Promise.all(
			printable.flatMap(({ cards }) =>
				cards.map(
					async (entry): Promise<[string, string]> => [
						entry.id,
						await QRCode.toDataURL(`${origin}/e/${entry.id}`, {
							errorCorrectionLevel: 'M',
							margin: 0
						})
					]
				)
			)
		)
	);

	const doc = new jsPDF();
	const tableLabel = translate('manage_registrations.pdf_table');
	let firstPage = true;

	for (const { category, cards } of printable) {
		const categoryText = categoryLabel(category, translate);
		const pages = paginateCards(
			cards.map(cardHeight),
			CONTENT_H,
			CARD_GAP
		);

		for (const page of pages) {
			if (!firstPage) doc.addPage();
			firstPage = false;
			let y = MARGIN;
			page.forEach((cardIndex, i) => {
				const entry = cards[cardIndex];
				drawCard(doc, y, entry, competitionName, categoryText, tableLabel, qrByEntryId.get(entry.id) as string);
				y += cardHeight(entry);
				if (i < page.length - 1) {
					drawCutLine(doc, y + CARD_GAP / 2);
					y += CARD_GAP;
				}
			});
		}
	}

	const safeName = competitionName.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
	const suffix =
		printable.length === 1
			? `${categoryLabel(printable[0].category, translate).replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_')}-cards`
			: 'cards';
	doc.save(`${safeName}-${suffix}.pdf`);
}
