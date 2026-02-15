import { CompetitionStatus } from '@prisma/client';

export function getCompetitionStatusLabel(status: CompetitionStatus): string {
    const statusLabels: Record<CompetitionStatus, string> = {
        NOT_STARTED: 'Not Started',
        STARTED: 'Started',
        FINISHED: 'Finished',
        CANCELLED: 'Cancelled'
    };
    return statusLabels[status] || status;
}
