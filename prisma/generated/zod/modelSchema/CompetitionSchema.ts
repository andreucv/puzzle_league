import { z } from 'zod';
import { CompetitionStatusSchema } from '../inputTypeSchemas/CompetitionStatusSchema'

/////////////////////////////////////////
// COMPETITION SCHEMA
/////////////////////////////////////////

export const CompetitionSchema = z.object({
  status: CompetitionStatusSchema,
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  leagueId: z.string().nullable(),
  creatorId: z.string(),
  registrationOpen: z.boolean(),
})

export type Competition = z.infer<typeof CompetitionSchema>

export default CompetitionSchema;
