import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionCreateWithoutRequestsInputSchema } from './CompetitionCreateWithoutRequestsInputSchema';
import { CompetitionUncheckedCreateWithoutRequestsInputSchema } from './CompetitionUncheckedCreateWithoutRequestsInputSchema';

export const CompetitionCreateOrConnectWithoutRequestsInputSchema: z.ZodType<Prisma.CompetitionCreateOrConnectWithoutRequestsInput> = z.object({
  where: z.lazy(() => CompetitionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutRequestsInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutRequestsInputSchema) ]),
}).strict();

export default CompetitionCreateOrConnectWithoutRequestsInputSchema;
