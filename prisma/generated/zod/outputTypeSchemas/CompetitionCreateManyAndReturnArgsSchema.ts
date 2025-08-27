import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionCreateManyInputSchema } from '../inputTypeSchemas/CompetitionCreateManyInputSchema'

export const CompetitionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CompetitionCreateManyAndReturnArgs> = z.object({
  data: z.union([ CompetitionCreateManyInputSchema,CompetitionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default CompetitionCreateManyAndReturnArgsSchema;
