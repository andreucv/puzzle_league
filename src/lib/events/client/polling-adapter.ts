import type { TransportAdapter } from './transport';
import type { ConnectionStatus } from '../types';

export interface PollingAdapterOptions {
	url: string;
	activeInterval: number;
	idleInterval: number;
	backgroundInterval: number;
	isActive: (state: unknown) => boolean;
}

/**
 * Polling transport using setInterval + fetch with ETag/If-None-Match.
 * Adaptive intervals: active, idle, background.
 * Page Visibility API integration — pauses polling when tab hidden.
 * Error handling with exponential backoff.
 */
export class PollingAdapter<TState> implements TransportAdapter<TState> {
	private url: string;
	private activeInterval: number;
	private idleInterval: number;
	private backgroundInterval: number;
	private isActiveFn: (state: unknown) => boolean;

	private stateCallback: ((state: TState) => void) | null = null;
	private statusCallback: ((status: ConnectionStatus) => void) | null = null;

	private timer: ReturnType<typeof setInterval> | null = null;
	private etag: string | null = null;
	private currentState: TState | null = null;
	private connected = false;
	private errorCount = 0;
	private isBackground = false;
	private visibilityHandler: (() => void) | null = null;
	private polling = false;

	constructor(options: PollingAdapterOptions) {
		this.url = options.url;
		this.activeInterval = options.activeInterval;
		this.idleInterval = options.idleInterval;
		this.backgroundInterval = options.backgroundInterval;
		this.isActiveFn = options.isActive;
	}

	onStateUpdate(callback: (state: TState) => void): void {
		this.stateCallback = callback;
	}

	onStatusChange(callback: (status: ConnectionStatus) => void): void {
		this.statusCallback = callback;
	}

	connect(): void {
		if (this.connected) return;
		this.connected = true;
		this.statusCallback?.('connecting');

		// Page Visibility API
		this.visibilityHandler = () => {
			this.isBackground = document.hidden;
			this.reschedule();
		};
		document.addEventListener('visibilitychange', this.visibilityHandler);

		// Initial fetch then start polling
		this.poll().then(() => this.schedule());
	}

	disconnect(): void {
		this.connected = false;
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		if (this.visibilityHandler) {
			document.removeEventListener('visibilitychange', this.visibilityHandler);
			this.visibilityHandler = null;
		}
		this.statusCallback?.('disconnected');
	}

	/** Force an immediate poll (used by manual refresh) */
	async refresh(): Promise<void> {
		await this.poll();
	}

	private getInterval(): number {
		if (this.isBackground) return this.backgroundInterval;

		// Exponential backoff on errors
		if (this.errorCount > 0) {
			const backoff = Math.min(this.activeInterval * Math.pow(2, this.errorCount), 30_000);
			return backoff;
		}

		if (this.currentState && this.isActiveFn(this.currentState)) {
			return this.activeInterval;
		}
		return this.idleInterval;
	}

	private schedule(): void {
		if (!this.connected) return;
		if (this.timer) clearInterval(this.timer);
		this.timer = setInterval(() => this.poll(), this.getInterval());
	}

	private reschedule(): void {
		this.schedule();
	}

	/** Reset error state — call after a successful user action to avoid stale error status */
	resetErrors(): void {
		if (this.errorCount > 0) {
			this.errorCount = 0;
			this.reschedule();
		}
	}

	private async poll(): Promise<void> {
		if (!this.connected || this.polling) return;
		this.polling = true;

		try {
			const headers: HeadersInit = {};
			if (this.etag) {
				headers['If-None-Match'] = this.etag;
			}

			const response = await fetch(this.url, { headers });

			if (response.status === 304) {
				// State unchanged
				if (this.errorCount > 0) {
					this.errorCount = 0;
					this.reschedule();
				}
				this.statusCallback?.('connected');
				return;
			}

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const newEtag = response.headers.get('ETag');
			if (newEtag) this.etag = newEtag;

			const state = (await response.json()) as TState;
			this.currentState = state;
			this.stateCallback?.(state);

			if (this.errorCount > 0) {
				this.errorCount = 0;
				this.reschedule();
			}
			this.statusCallback?.('connected');
		} catch {
			this.errorCount++;
			this.statusCallback?.(this.errorCount >= 3 ? 'error' : 'reconnecting');
			this.reschedule();
		} finally {
			this.polling = false;
		}
	}
}
