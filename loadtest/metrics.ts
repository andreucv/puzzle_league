/**
 * In-harness metrics: latency samples per (phase, label), error counts, and Ably counters.
 * A single shared instance is imported by the HTTP layer and actors.
 */
export type Phase = 'setup' | 'phase1-finishes' | 'transition' | 'phase2-pieces' | 'drain';

interface Sample {
	phase: Phase;
	label: string;
	status: number; // HTTP status, or 0 for a network/transport error
	ms: number;
}

function percentile(sorted: number[], p: number): number {
	if (sorted.length === 0) return 0;
	const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
	return Math.round(sorted[Math.max(0, idx)]);
}

export interface LabelStats {
	count: number;
	errors: number;
	p50: number;
	p95: number;
	p99: number;
	statusCounts: Record<string, number>;
}

export class Metrics {
	private samples: Sample[] = [];
	private phase: Phase = 'setup';
	eventsReceived = 0;
	connectionFailures = 0;
	rateLimited = 0; // count of 429 responses

	setPhase(phase: Phase): void {
		this.phase = phase;
	}

	record(label: string, status: number, ms: number): void {
		if (status === 429) this.rateLimited++;
		this.samples.push({ phase: this.phase, label, status, ms });
	}

	eventReceived(): void {
		this.eventsReceived++;
	}

	connectionFailed(): void {
		this.connectionFailures++;
	}

	private statsFor(filter: (s: Sample) => boolean): LabelStats {
		const matching = this.samples.filter(filter);
		const latencies = matching.map((s) => s.ms).sort((a, b) => a - b);
		const statusCounts: Record<string, number> = {};
		let errors = 0;
		for (const s of matching) {
			const key = String(s.status);
			statusCounts[key] = (statusCounts[key] ?? 0) + 1;
			if (s.status === 0 || s.status >= 400) errors++;
		}
		return {
			count: matching.length,
			errors,
			p50: percentile(latencies, 50),
			p95: percentile(latencies, 95),
			p99: percentile(latencies, 99),
			statusCounts
		};
	}

	private labels(): string[] {
		return [...new Set(this.samples.map((s) => s.label))].sort();
	}

	private phases(): Phase[] {
		return [...new Set(this.samples.map((s) => s.phase))];
	}

	/** Overall error rate across all requests (network errors + HTTP >= 400). */
	errorRate(): number {
		if (this.samples.length === 0) return 0;
		const errors = this.samples.filter((s) => s.status === 0 || s.status >= 400).length;
		return errors / this.samples.length;
	}

	/** Worst p95 for the read re-fetch and the write endpoints, for SLO checks. */
	readP95(): number {
		return this.statsFor((s) => s.label === 'refetch').p95;
	}

	writeP95(): number {
		return this.statsFor((s) => s.label === 'finish' || s.label === 'pieces').p95;
	}

	toJSON(): object {
		const byLabel: Record<string, LabelStats> = {};
		for (const label of this.labels()) {
			byLabel[label] = this.statsFor((s) => s.label === label);
		}
		const byPhaseLabel: Record<string, Record<string, LabelStats>> = {};
		for (const phase of this.phases()) {
			byPhaseLabel[phase] = {};
			for (const label of this.labels()) {
				const stats = this.statsFor((s) => s.phase === phase && s.label === label);
				if (stats.count > 0) byPhaseLabel[phase][label] = stats;
			}
		}
		return {
			totalRequests: this.samples.length,
			eventsReceived: this.eventsReceived,
			connectionFailures: this.connectionFailures,
			rateLimited: this.rateLimited,
			errorRate: this.errorRate(),
			byLabel,
			byPhaseLabel
		};
	}

	printSummary(): void {
		console.log('\n──────────── Load test summary ────────────');
		console.log(`Total requests:      ${this.samples.length}`);
		console.log(`Ably events received: ${this.eventsReceived}`);
		console.log(`Connection failures:  ${this.connectionFailures}`);
		console.log(`Rate-limited (429):   ${this.rateLimited}`);
		console.log(`Overall error rate:   ${(this.errorRate() * 100).toFixed(2)}%`);
		console.log('\nPer endpoint:');
		console.log('  label      count   errors    p50     p95     p99   statuses');
		for (const label of this.labels()) {
			const s = this.statsFor((x) => x.label === label);
			const statuses = Object.entries(s.statusCounts)
				.map(([k, v]) => `${k}:${v}`)
				.join(' ');
			console.log(
				`  ${label.padEnd(9)} ${String(s.count).padStart(6)} ${String(s.errors).padStart(7)} ` +
					`${String(s.p50).padStart(6)} ${String(s.p95).padStart(6)} ${String(s.p99).padStart(6)}   ${statuses}`
			);
		}
		console.log('────────────────────────────────────────────\n');
	}
}

export const metrics = new Metrics();
