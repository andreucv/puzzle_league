import { z } from 'zod';

/////////////////////////////////////////
// LEAGUE POINTS SCHEMA
/////////////////////////////////////////

export const LeaguePointsSchema = z.object({
  id: z.string().cuid(),
  totalPoints: z.number().int(),
  leagueId: z.string(),
  userId: z.string(),
})

export type LeaguePoints = z.infer<typeof LeaguePointsSchema>

export default LeaguePointsSchema;
