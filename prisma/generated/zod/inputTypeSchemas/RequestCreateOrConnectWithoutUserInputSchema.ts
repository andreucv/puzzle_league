import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';
import { RequestCreateWithoutUserInputSchema } from './RequestCreateWithoutUserInputSchema';
import { RequestUncheckedCreateWithoutUserInputSchema } from './RequestUncheckedCreateWithoutUserInputSchema';

export const RequestCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.RequestCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => RequestWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RequestCreateWithoutUserInputSchema),z.lazy(() => RequestUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default RequestCreateOrConnectWithoutUserInputSchema;
