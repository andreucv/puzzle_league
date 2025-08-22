import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsUpdateManyMutationInputSchema } from '../inputTypeSchemas/LeaguePointsUpdateManyMutationInputSchema'
import { LeaguePointsUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/LeaguePointsUncheckedUpdateManyInputSchema'
import { LeaguePointsWhereInputSchema } from '../inputTypeSchemas/LeaguePointsWhereInputSchema'

export const LeaguePointsUpdateManyArgsSchema: z.ZodType<Prisma.LeaguePointsUpdateManyArgs> = z.object({
  data: z.union([ LeaguePointsUpdateManyMutationInputSchema,LeaguePointsUncheckedUpdateManyInputSchema ]),
  where: LeaguePointsWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default LeaguePointsUpdateManyArgsSchema;
