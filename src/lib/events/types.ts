// ---------------------------------------------------------------------------
// Ably Pub/Sub — state shapes and event types
// ---------------------------------------------------------------------------

/** Connection status for Ably realtime streams */
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

/** Competition event state — lightweight snapshot of categories */
export interface CompetitionEventState {
	version: string;
	categories: Array<{
		id: number;
		status: string;
		totalEntries: number;
		finishedEntries: number;
		realStartTime: string | null;
		realEndTime: string | null;
		extraMinutes: number;
		autoStop: boolean;
	}>;
}

/** Notification event state — just unread status */
export interface NotificationEventState {
	version: string;
	hasUnread: boolean;
	latestId: string | null;
}

// ---------------------------------------------------------------------------
// Ably Pub/Sub event types for competition channels
// ---------------------------------------------------------------------------

export interface CategoryStatusChangedEvent {
	type: 'category.status_changed';
	categoryId: number;
	competitionId: number;
	status: string;
	realStartTime?: string | null;
	realEndTime?: string | null;
	autoStop?: boolean;
}

export interface RecordFinishedEvent {
	type: 'record.finished';
	recordId: string;
	categoryId: number;
	competitionId: number;
	finishTime: string;
}

export interface RecordUnfinishedEvent {
	type: 'record.unfinished';
	recordId: string;
	categoryId: number;
	competitionId: number;
}

export interface RecordPiecesUpdatedEvent {
	type: 'record.pieces_updated';
	recordId: string;
	categoryId: number;
	competitionId: number;
	nPiecesCompleted: number;
}

export interface CategoryTimeExtendedEvent {
	type: 'category.time_extended';
	categoryId: number;
	competitionId: number;
	extraMinutes: number;
	addedMinutes: number;
}

export type CompetitionEvent =
	| CategoryStatusChangedEvent
	| RecordFinishedEvent
	| RecordUnfinishedEvent
	| RecordPiecesUpdatedEvent
	| CategoryTimeExtendedEvent;

// Monotonic counter for generating unique event versions on the client side.
// Each applied event gets a unique version so downstream effects can detect changes.
let _eventSeq = 0;
function nextEventVersion(): string {
	return `evt-${++_eventSeq}-${Date.now()}`;
}

/**
 * Apply a single Ably event to the current competition state.
 * Returns a new state object (immutable update).
 */
export function applyCompetitionEvent(
	state: CompetitionEventState,
	event: CompetitionEvent
): CompetitionEventState {
	switch (event.type) {
		case 'category.status_changed': {
			return {
				...state,
				version: nextEventVersion(),
				categories: state.categories.map((cat) =>
					cat.id === event.categoryId
						? {
								...cat,
								status: event.status,
								realStartTime: event.realStartTime !== undefined ? event.realStartTime : cat.realStartTime,
								realEndTime: event.realEndTime !== undefined ? event.realEndTime : cat.realEndTime,
							// On restart, reset finished entries
							finishedEntries:
								event.status === 'LIVE' &&
								(cat.status === 'COMPLETE' || cat.status === 'CANCELED' || cat.status === 'STOPPED')
									? 0
									: cat.finishedEntries
							}
						: cat
				)
			};
		}
		case 'record.finished': {
			return {
				...state,
				version: nextEventVersion(),
				categories: state.categories.map((cat) =>
					cat.id === event.categoryId
					? { ...cat, finishedEntries: cat.finishedEntries + 1 }
						: cat
				)
			};
		}
		case 'record.unfinished': {
			return {
				...state,
				version: nextEventVersion(),
				categories: state.categories.map((cat) =>
					cat.id === event.categoryId
					? { ...cat, finishedEntries: Math.max(0, cat.finishedEntries - 1) }
						: cat
				)
			};
		}
		case 'record.pieces_updated': {
			// Pieces updates don't change the category-level state shape,
			// but signal the results page to re-fetch
			return state;
		}
		case 'category.time_extended': {
			return {
				...state,
				version: nextEventVersion(),
				categories: state.categories.map((cat) =>
					cat.id === event.categoryId
						? { ...cat, extraMinutes: event.extraMinutes }
						: cat
				)
			};
		}
	}
}
