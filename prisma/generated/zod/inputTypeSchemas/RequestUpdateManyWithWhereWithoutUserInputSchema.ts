import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestScalarWhereInputSchema } from './RequestScalarWhereInputSchema';
import { RequestUpdateManyMutationInputSchema } from './RequestUpdateManyMutationInputSchema';
import { RequestUncheckedUpdateManyWithoutUserInputSchema } from './RequestUncheckedUpdateManyWithoutUserInputSchema';

export const RequestUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.RequestUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => RequestScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RequestUpdateManyMutationInputSchema),z.lazy(() => RequestUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export default RequestUpdateManyWithWhereWithoutUserInputSchema;
