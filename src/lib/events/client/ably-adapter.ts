import * as Ably from 'ably';
import type { ConnectionStatus } from '../types';

export interface AblyAdapterOptions {
	channelName: string;
	authUrl?: string;
}

/**
 * Ably Realtime transport adapter.
 * Subscribes to a channel and forwards messages via callbacks.
 * Uses JWT auth via /api/ably-token endpoint.
 */
export class AblyAdapter {
	private client: Ably.Realtime | null = null;
	private channel: Ably.RealtimeChannel | null = null;
	private channelName: string;
	private authUrl: string;
	private messageCallback: ((name: string, data: unknown) => void) | null = null;
	private statusCallback: ((status: ConnectionStatus) => void) | null = null;

	constructor(options: AblyAdapterOptions) {
		this.channelName = options.channelName;
		this.authUrl = options.authUrl ?? '/api/ably-token';
	}

	onMessage(callback: (name: string, data: unknown) => void): void {
		this.messageCallback = callback;
	}

	onStatusChange(callback: (status: ConnectionStatus) => void): void {
		this.statusCallback = callback;
	}

	connect(): void {
		if (this.client) return;

		this.statusCallback?.('connecting');

		this.client = new Ably.Realtime({
			authCallback: async (_tokenParams, callback) => {
				try {
					const res = await fetch(this.authUrl, { credentials: 'include' });
					if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
					callback(null, await res.text());
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					callback(message, null);
				}
			}
		});

		this.client.connection.on('connected', () => {
			this.statusCallback?.('connected');
		});

		this.client.connection.on('connecting', () => {
			this.statusCallback?.('connecting');
		});

		this.client.connection.on('disconnected', () => {
			this.statusCallback?.('reconnecting');
		});

		this.client.connection.on('suspended', () => {
			this.statusCallback?.('error');
		});

		this.client.connection.on('failed', () => {
			this.statusCallback?.('error');
		});

		this.client.connection.on('closed', () => {
			this.statusCallback?.('disconnected');
		});

		this.channel = this.client.channels.get(this.channelName);
		this.channel.subscribe((message) => {
			this.messageCallback?.(message.name ?? '', message.data);
		});
	}

	disconnect(): void {
		if (this.channel) {
			this.channel.unsubscribe();
			this.channel = null;
		}
		if (this.client) {
			this.client.close();
			this.client = null;
		}
		this.statusCallback?.('disconnected');
	}

	/** Whether the connection was suspended (missed messages possible) */
	get wasSuspended(): boolean {
		return this.client?.connection.state === 'suspended';
	}
}
