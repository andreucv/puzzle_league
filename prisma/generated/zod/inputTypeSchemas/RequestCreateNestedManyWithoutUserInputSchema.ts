import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestCreateWithoutUserInputSchema } from './RequestCreateWithoutUserInputSchema';
import { RequestUncheckedCreateWithoutUserInputSchema } from './RequestUncheckedCreateWithoutUserInputSchema';
import { RequestCreateOrConnectWithoutUserInputSchema } from './RequestCreateOrConnectWithoutUserInputSchema';
import { RequestCreateManyUserInputEnvelopeSchema } from './RequestCreateManyUserInputEnvelopeSchema';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';

export const RequestCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.RequestCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => RequestCreateWithoutUserInputSchema),z.lazy(() => RequestCreateWithoutUserInputSchema).array(),z.lazy(() => RequestUncheckedCreateWithoutUserInputSchema),z.lazy(() => RequestUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RequestCreateOrConnectWithoutUserInputSchema),z.lazy(() => RequestCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RequestCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default RequestCreateNestedManyWithoutUserInputSchema;
