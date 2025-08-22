import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RecordUpdateManyMutationInputSchema } from '../inputTypeSchemas/RecordUpdateManyMutationInputSchema'
import { RecordUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/RecordUncheckedUpdateManyInputSchema'
import { RecordWhereInputSchema } from '../inputTypeSchemas/RecordWhereInputSchema'

export const RecordUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.RecordUpdateManyAndReturnArgs> = z.object({
  data: z.union([ RecordUpdateManyMutationInputSchema,RecordUncheckedUpdateManyInputSchema ]),
  where: RecordWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default RecordUpdateManyAndReturnArgsSchema;
