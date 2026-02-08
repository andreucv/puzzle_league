import { z } from 'zod';

export const CompetitionStatusSchema = z.enum(['NOT_STARTED','STARTED','FINISHED','CANCELLED']);

export type CompetitionStatusType = `${z.infer<typeof CompetitionStatusSchema>}`

export default CompetitionStatusSchema;
