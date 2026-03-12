import type { ConnectionStatus } from '../types';

/** Abstract transport adapter interface for client-side event streams */
export interface TransportAdapter<TState> {
	connect(): void;
	disconnect(): void;
	onStateUpdate(callback: (state: TState) => void): void;
	onStatusChange(callback: (status: ConnectionStatus) => void): void;
}
