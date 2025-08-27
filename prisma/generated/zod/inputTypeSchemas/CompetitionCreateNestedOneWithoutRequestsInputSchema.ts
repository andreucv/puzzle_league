import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutRequestsInputSchema } from './CompetitionCreateWithoutRequestsInputSchema';
import { CompetitionUncheckedCreateWithoutRequestsInputSchema } from './CompetitionUncheckedCreateWithoutRequestsInputSchema';
import { CompetitionCreateOrConnectWithoutRequestsInputSchema } from './CompetitionCreateOrConnectWithoutRequestsInputSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';

export const CompetitionCreateNestedOneWithoutRequestsInputSchema: z.ZodType<Prisma.CompetitionCreateNestedOneWithoutRequestsInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutRequestsInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutRequestsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CompetitionCreateOrConnectWithoutRequestsInputSchema).optional(),
  connect: z.lazy(() => CompetitionWhereUniqueInputSchema).optional()
}).strict();

export default CompetitionCreateNestedOneWithoutRequestsInputSchema;
