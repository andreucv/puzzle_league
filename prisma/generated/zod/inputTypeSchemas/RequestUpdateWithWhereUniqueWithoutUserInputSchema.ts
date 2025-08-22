import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';
import { RequestUpdateWithoutUserInputSchema } from './RequestUpdateWithoutUserInputSchema';
import { RequestUncheckedUpdateWithoutUserInputSchema } from './RequestUncheckedUpdateWithoutUserInputSchema';

export const RequestUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.RequestUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => RequestWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RequestUpdateWithoutUserInputSchema),z.lazy(() => RequestUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export default RequestUpdateWithWhereUniqueWithoutUserInputSchema;
