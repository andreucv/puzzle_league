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
}

export interface RecordFinishedEvent {
	type: 'record.finished';
	recordId: string;
	categoryId: number;
	competitionId: number;
	finishTime: string;
}

export interface RecordPiecesUpdatedEvent {
	type: 'record.pieces_updated';
	recordId: string;
	categoryId: number;
	competitionId: number;
	nPiecesCompleted: number;
}

export type CompetitionEvent =
	| CategoryStatusChangedEvent
	| RecordFinishedEvent
	| RecordPiecesUpdatedEvent;

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
				version: '', // version is only meaningful for polling ETags
				categories: state.categories.map((cat) =>
					cat.id === event.categoryId
						? {
								...cat,
								status: event.status,
								realStartTime: event.realStartTime !== undefined ? event.realStartTime : cat.realStartTime,
								realEndTime: event.realEndTime !== undefined ? event.realEndTime : cat.realEndTime,
								// On restart, reset finished records
								finishedRecords:
									event.status === 'LIVE' &&
									(cat.status === 'COMPLETE' || cat.status === 'CANCELED' || cat.status === 'STOPPED')
										? 0
										: cat.finishedRecords
							}
						: cat
				)
			};
		}
		case 'record.finished': {
			return {
				...state,
				version: '',
				categories: state.categories.map((cat) =>
					cat.id === event.categoryId
						? { ...cat, finishedRecords: cat.finishedRecords + 1 }
						: cat
				)
			};
		}
		case 'record.pieces_updated': {
			// Pieces updates don't change the category-level state shape,
			// but signal the results page to re-fetch
			return state;
		}
	}
}
