import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RequestCreateManyInputSchema } from '../inputTypeSchemas/RequestCreateManyInputSchema'

export const RequestCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RequestCreateManyAndReturnArgs> = z.object({
  data: z.union([ RequestCreateManyInputSchema,RequestCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default RequestCreateManyAndReturnArgsSchema;
