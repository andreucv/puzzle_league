/**
 * Flattens a sveltekit-superforms error tree into readable, actionable lines.
 *
 * Superforms represents errors as a nested structure mirroring the schema:
 * leaves are `string[]` of messages, arrays/objects are keyed by field name or
 * numeric index. Category errors are prefixed with their position so an
 * organizer knows exactly which category to fix (e.g. "Category 2: Start time
 * is required").
 *
 * Pure and dependency-free so it can be used on both the client and the server.
 */
/** Top-level fields the form manages internally — never actionable by the organizer. */
const INTERNAL_FIELDS = new Set(['creator', 'status', 'id', 'image_cld_id']);

export function collectFormErrorMessages(errors: unknown): string[] {
	const out: string[] = [];
	walk(errors, [], out);
	// De-duplicate while preserving order.
	return [...new Set(out)];
}

function walk(node: unknown, path: string[], out: string[]) {
	if (node == null) return;

	if (Array.isArray(node)) {
		if (node.length > 0 && node.every((v) => typeof v === 'string')) {
			const label = labelForPath(path);
			const message = (node as string[]).join(', ');
			out.push(label ? `${label}: ${message}` : message);
		} else {
			node.forEach((v, i) => walk(v, [...path, String(i)], out));
		}
		return;
	}

	if (typeof node === 'object') {
		for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
			if (path.length === 0 && INTERNAL_FIELDS.has(key)) continue;
			walk(value, [...path, key], out);
		}
	}
}

/** Produces a human-friendly prefix for a category error path, or '' for top-level fields. */
function labelForPath(path: string[]): string {
	if (path[0] === 'categories' && (path[1] === 'create' || path[1] === 'update')) {
		const idx = Number(path[2]);
		const position = Number.isFinite(idx) ? ` ${idx + 1}` : '';
		return path[1] === 'create' ? `New category${position}` : `Category${position}`;
	}
	return '';
}
