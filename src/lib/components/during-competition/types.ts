export type RecordActionMode = 'finish' | 'undo-finish' | 'pieces' | 'undo-pieces';

export type RecordActionHandler = (recordId: string, data?: { nPiecesCompleted: number }) => Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = any;

export interface OverflowConfirmAction {
	kind: 'confirm';
	icon: IconComponent;
	label: string;
	colorClass: string;
	confirmTitle: string;
	confirmMessage: string;
	onConfirm: () => void;
	testId: string;
}

export interface OverflowLinkAction {
	kind: 'link';
	icon: IconComponent;
	label: string;
	href: string;
	testId: string;
}

export type OverflowAction = OverflowConfirmAction | OverflowLinkAction;
