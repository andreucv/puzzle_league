import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionCreateManyInputSchema } from '../inputTypeSchemas/CompetitionCreateManyInputSchema'

export const CompetitionCreateManyArgsSchema: z.ZodType<Prisma.CompetitionCreateManyArgs> = z.object({
  data: z.union([ CompetitionCreateManyInputSchema,CompetitionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default CompetitionCreateManyArgsSchema;
