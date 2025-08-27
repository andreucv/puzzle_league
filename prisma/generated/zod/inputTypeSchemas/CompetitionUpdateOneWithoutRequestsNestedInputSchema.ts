import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutRequestsInputSchema } from './CompetitionCreateWithoutRequestsInputSchema';
import { CompetitionUncheckedCreateWithoutRequestsInputSchema } from './CompetitionUncheckedCreateWithoutRequestsInputSchema';
import { CompetitionCreateOrConnectWithoutRequestsInputSchema } from './CompetitionCreateOrConnectWithoutRequestsInputSchema';
import { CompetitionUpsertWithoutRequestsInputSchema } from './CompetitionUpsertWithoutRequestsInputSchema';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionUpdateToOneWithWhereWithoutRequestsInputSchema } from './CompetitionUpdateToOneWithWhereWithoutRequestsInputSchema';
import { CompetitionUpdateWithoutRequestsInputSchema } from './CompetitionUpdateWithoutRequestsInputSchema';
import { CompetitionUncheckedUpdateWithoutRequestsInputSchema } from './CompetitionUncheckedUpdateWithoutRequestsInputSchema';

export const CompetitionUpdateOneWithoutRequestsNestedInputSchema: z.ZodType<Prisma.CompetitionUpdateOneWithoutRequestsNestedInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutRequestsInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutRequestsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CompetitionCreateOrConnectWithoutRequestsInputSchema).optional(),
  upsert: z.lazy(() => CompetitionUpsertWithoutRequestsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => CompetitionWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => CompetitionWhereInputSchema) ]).optional(),
  connect: z.lazy(() => CompetitionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CompetitionUpdateToOneWithWhereWithoutRequestsInputSchema),z.lazy(() => CompetitionUpdateWithoutRequestsInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutRequestsInputSchema) ]).optional(),
}).strict();

export default CompetitionUpdateOneWithoutRequestsNestedInputSchema;
