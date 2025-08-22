import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';
import { RequestUpdateWithoutUserInputSchema } from './RequestUpdateWithoutUserInputSchema';
import { RequestUncheckedUpdateWithoutUserInputSchema } from './RequestUncheckedUpdateWithoutUserInputSchema';
import { RequestCreateWithoutUserInputSchema } from './RequestCreateWithoutUserInputSchema';
import { RequestUncheckedCreateWithoutUserInputSchema } from './RequestUncheckedCreateWithoutUserInputSchema';

export const RequestUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.RequestUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => RequestWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RequestUpdateWithoutUserInputSchema),z.lazy(() => RequestUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => RequestCreateWithoutUserInputSchema),z.lazy(() => RequestUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default RequestUpsertWithWhereUniqueWithoutUserInputSchema;
