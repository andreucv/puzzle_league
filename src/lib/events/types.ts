// ---------------------------------------------------------------------------
// Channel definitions, state shapes, transport interface
// ---------------------------------------------------------------------------

/** Connection status for event streams */
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

/** Competition event state — lightweight snapshot of categories */
export interface CompetitionEventState {
	version: string;
	categories: Array<{
		id: number;
		status: string;
		totalRecords: number;
		finishedRecords: number;
		realStartTime: string | null;
		realEndTime: string | null;
	}>;
}

/** Notification event state — just unread status */
export interface NotificationEventState {
	version: string;
	hasUnread: boolean;
	latestId: string | null;
}

/** Map channel names to their params and state shapes */
export interface ChannelMap {
	competition: { params: { id: number }; state: CompetitionEventState };
	notifications: { params: { userId: string }; state: NotificationEventState };
}

export type ChannelName = keyof ChannelMap;

/** Transport adapter interface — implemented by polling, SSE, etc. */
export interface TransportAdapter<TState> {
	connect(): void;
	disconnect(): void;
	onStateUpdate(callback: (state: TState) => void): void;
	onStatusChange(callback: (status: ConnectionStatus) => void): void;
}

/** Options for event streams */
export interface EventStreamOptions {
	/** Polling interval when active (ms) */
	activeInterval?: number;
	/** Polling interval when idle (ms) */
	idleInterval?: number;
	/** Polling interval when tab is backgrounded (ms) */
	backgroundInterval?: number;
	/** Callback to determine if stream should use active interval */
	isActive?: (state: unknown) => boolean;
}
