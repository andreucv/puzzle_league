import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsCreateManyInputSchema } from '../inputTypeSchemas/LeaguePointsCreateManyInputSchema'

export const LeaguePointsCreateManyArgsSchema: z.ZodType<Prisma.LeaguePointsCreateManyArgs> = z.object({
  data: z.union([ LeaguePointsCreateManyInputSchema,LeaguePointsCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default LeaguePointsCreateManyArgsSchema;
