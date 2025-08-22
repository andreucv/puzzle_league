import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';
import { CompetitionUpdateWithoutRequestsInputSchema } from './CompetitionUpdateWithoutRequestsInputSchema';
import { CompetitionUncheckedUpdateWithoutRequestsInputSchema } from './CompetitionUncheckedUpdateWithoutRequestsInputSchema';

export const CompetitionUpdateToOneWithWhereWithoutRequestsInputSchema: z.ZodType<Prisma.CompetitionUpdateToOneWithWhereWithoutRequestsInput> = z.object({
  where: z.lazy(() => CompetitionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CompetitionUpdateWithoutRequestsInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutRequestsInputSchema) ]),
}).strict();

export default CompetitionUpdateToOneWithWhereWithoutRequestsInputSchema;
