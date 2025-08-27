import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RequestCreateManyInputSchema } from '../inputTypeSchemas/RequestCreateManyInputSchema'

export const RequestCreateManyArgsSchema: z.ZodType<Prisma.RequestCreateManyArgs> = z.object({
  data: z.union([ RequestCreateManyInputSchema,RequestCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default RequestCreateManyArgsSchema;
