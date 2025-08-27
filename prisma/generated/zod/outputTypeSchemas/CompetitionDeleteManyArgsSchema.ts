import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionWhereInputSchema } from '../inputTypeSchemas/CompetitionWhereInputSchema'

export const CompetitionDeleteManyArgsSchema: z.ZodType<Prisma.CompetitionDeleteManyArgs> = z.object({
  where: CompetitionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default CompetitionDeleteManyArgsSchema;
