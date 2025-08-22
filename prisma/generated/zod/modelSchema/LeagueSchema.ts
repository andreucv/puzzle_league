import { z } from 'zod';

/////////////////////////////////////////
// LEAGUE SCHEMA
/////////////////////////////////////////

export const LeagueSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type League = z.infer<typeof LeagueSchema>

export default LeagueSchema;
