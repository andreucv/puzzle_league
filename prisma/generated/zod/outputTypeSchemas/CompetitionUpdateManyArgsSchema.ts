import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionUpdateManyMutationInputSchema } from '../inputTypeSchemas/CompetitionUpdateManyMutationInputSchema'
import { CompetitionUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/CompetitionUncheckedUpdateManyInputSchema'
import { CompetitionWhereInputSchema } from '../inputTypeSchemas/CompetitionWhereInputSchema'

export const CompetitionUpdateManyArgsSchema: z.ZodType<Prisma.CompetitionUpdateManyArgs> = z.object({
  data: z.union([ CompetitionUpdateManyMutationInputSchema,CompetitionUncheckedUpdateManyInputSchema ]),
  where: CompetitionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default CompetitionUpdateManyArgsSchema;
