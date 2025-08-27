import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestScalarWhereInputSchema } from './RequestScalarWhereInputSchema';
import { RequestUpdateManyMutationInputSchema } from './RequestUpdateManyMutationInputSchema';
import { RequestUncheckedUpdateManyWithoutCompetitionInputSchema } from './RequestUncheckedUpdateManyWithoutCompetitionInputSchema';

export const RequestUpdateManyWithWhereWithoutCompetitionInputSchema: z.ZodType<Prisma.RequestUpdateManyWithWhereWithoutCompetitionInput> = z.object({
  where: z.lazy(() => RequestScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RequestUpdateManyMutationInputSchema),z.lazy(() => RequestUncheckedUpdateManyWithoutCompetitionInputSchema) ]),
}).strict();

export default RequestUpdateManyWithWhereWithoutCompetitionInputSchema;
