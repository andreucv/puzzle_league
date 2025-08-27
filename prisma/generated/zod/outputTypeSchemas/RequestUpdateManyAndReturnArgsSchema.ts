import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RequestUpdateManyMutationInputSchema } from '../inputTypeSchemas/RequestUpdateManyMutationInputSchema'
import { RequestUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/RequestUncheckedUpdateManyInputSchema'
import { RequestWhereInputSchema } from '../inputTypeSchemas/RequestWhereInputSchema'

export const RequestUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.RequestUpdateManyAndReturnArgs> = z.object({
  data: z.union([ RequestUpdateManyMutationInputSchema,RequestUncheckedUpdateManyInputSchema ]),
  where: RequestWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default RequestUpdateManyAndReturnArgsSchema;
