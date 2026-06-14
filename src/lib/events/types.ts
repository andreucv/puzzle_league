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

export interface EntryFinishedEvent {
	type: 'entry.finished';
	entryId: string;
	categoryId: number;
	competitionId: number;
	finishTime: string;
}

export interface EntryUnfinishedEvent {
	type: 'entry.unfinished';
	entryId: string;
	categoryId: number;
	competitionId: number;
}

export interface EntryPiecesUpdatedEvent {
	type: 'entry.pieces_updated';
	entryId: string;
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

export interface CategoryAutoStopChangedEvent {
	type: 'category.auto_stop_changed';
	categoryId: number;
	competitionId: number;
	armed: boolean;
}

export type CompetitionEvent =
	| CategoryStatusChangedEvent
	| EntryFinishedEvent
	| EntryUnfinishedEvent
	| EntryPiecesUpdatedEvent
	| CategoryTimeExtendedEvent
	| CategoryAutoStopChangedEvent;

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
		case 'entry.finished': {
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
		case 'entry.unfinished': {
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
		case 'entry.pieces_updated': {
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
		case 'category.auto_stop_changed': {
			return {
				...state,
				version: nextEventVersion(),
				categories: state.categories.map((cat) =>
					cat.id === event.categoryId
						? { ...cat, autoStop: event.armed }
						: cat
				)
			};
		}
	}
}
