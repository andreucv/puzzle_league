export type RecordActionMode = 'finish' | 'undo-finish' | 'pieces' | 'undo-pieces';

export type RecordActionHandler = (recordId: string, data?: { nPiecesCompleted: number }) => Promise<void>;
