import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionUpdateWithoutRequestsInputSchema } from './CompetitionUpdateWithoutRequestsInputSchema';
import { CompetitionUncheckedUpdateWithoutRequestsInputSchema } from './CompetitionUncheckedUpdateWithoutRequestsInputSchema';
import { CompetitionCreateWithoutRequestsInputSchema } from './CompetitionCreateWithoutRequestsInputSchema';
import { CompetitionUncheckedCreateWithoutRequestsInputSchema } from './CompetitionUncheckedCreateWithoutRequestsInputSchema';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';

export const CompetitionUpsertWithoutRequestsInputSchema: z.ZodType<Prisma.CompetitionUpsertWithoutRequestsInput> = z.object({
  update: z.union([ z.lazy(() => CompetitionUpdateWithoutRequestsInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutRequestsInputSchema) ]),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutRequestsInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutRequestsInputSchema) ]),
  where: z.lazy(() => CompetitionWhereInputSchema).optional()
}).strict();

export default CompetitionUpsertWithoutRequestsInputSchema;
