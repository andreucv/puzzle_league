import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueWhereInputSchema } from '../inputTypeSchemas/LeagueWhereInputSchema'

export const LeagueDeleteManyArgsSchema: z.ZodType<Prisma.LeagueDeleteManyArgs> = z.object({
  where: LeagueWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default LeagueDeleteManyArgsSchema;
