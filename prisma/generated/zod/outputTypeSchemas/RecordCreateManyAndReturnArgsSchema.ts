import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RecordCreateManyInputSchema } from '../inputTypeSchemas/RecordCreateManyInputSchema'

export const RecordCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RecordCreateManyAndReturnArgs> = z.object({
  data: z.union([ RecordCreateManyInputSchema,RecordCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default RecordCreateManyAndReturnArgsSchema;
