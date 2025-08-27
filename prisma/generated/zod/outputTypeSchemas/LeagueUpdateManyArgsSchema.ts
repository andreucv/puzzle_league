import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueUpdateManyMutationInputSchema } from '../inputTypeSchemas/LeagueUpdateManyMutationInputSchema'
import { LeagueUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/LeagueUncheckedUpdateManyInputSchema'
import { LeagueWhereInputSchema } from '../inputTypeSchemas/LeagueWhereInputSchema'

export const LeagueUpdateManyArgsSchema: z.ZodType<Prisma.LeagueUpdateManyArgs> = z.object({
  data: z.union([ LeagueUpdateManyMutationInputSchema,LeagueUncheckedUpdateManyInputSchema ]),
  where: LeagueWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default LeagueUpdateManyArgsSchema;
