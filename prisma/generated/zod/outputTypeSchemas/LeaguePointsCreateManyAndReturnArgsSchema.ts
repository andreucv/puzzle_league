import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsCreateManyInputSchema } from '../inputTypeSchemas/LeaguePointsCreateManyInputSchema'

export const LeaguePointsCreateManyAndReturnArgsSchema: z.ZodType<Prisma.LeaguePointsCreateManyAndReturnArgs> = z.object({
  data: z.union([ LeaguePointsCreateManyInputSchema,LeaguePointsCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default LeaguePointsCreateManyAndReturnArgsSchema;
