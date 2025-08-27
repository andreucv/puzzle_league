import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueCreateManyInputSchema } from '../inputTypeSchemas/LeagueCreateManyInputSchema'

export const LeagueCreateManyArgsSchema: z.ZodType<Prisma.LeagueCreateManyArgs> = z.object({
  data: z.union([ LeagueCreateManyInputSchema,LeagueCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default LeagueCreateManyArgsSchema;
