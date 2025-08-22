import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsWhereInputSchema } from '../inputTypeSchemas/LeaguePointsWhereInputSchema'

export const LeaguePointsDeleteManyArgsSchema: z.ZodType<Prisma.LeaguePointsDeleteManyArgs> = z.object({
  where: LeaguePointsWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default LeaguePointsDeleteManyArgsSchema;
