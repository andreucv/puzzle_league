import { z } from 'zod';

export const LeaguePointsScalarFieldEnumSchema = z.enum(['id','totalPoints','leagueId','userId']);

export default LeaguePointsScalarFieldEnumSchema;
