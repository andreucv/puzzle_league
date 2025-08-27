import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionUpdateManyMutationInputSchema } from '../inputTypeSchemas/CompetitionUpdateManyMutationInputSchema'
import { CompetitionUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/CompetitionUncheckedUpdateManyInputSchema'
import { CompetitionWhereInputSchema } from '../inputTypeSchemas/CompetitionWhereInputSchema'

export const CompetitionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.CompetitionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ CompetitionUpdateManyMutationInputSchema,CompetitionUncheckedUpdateManyInputSchema ]),
  where: CompetitionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default CompetitionUpdateManyAndReturnArgsSchema;
