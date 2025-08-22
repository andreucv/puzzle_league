import { z } from 'zod';

export const CompetitionStatusSchema = z.enum(['UPCOMING','ACTIVE','COMPLETED','CANCELLED']);

export type CompetitionStatusType = `${z.infer<typeof CompetitionStatusSchema>}`

export default CompetitionStatusSchema;
