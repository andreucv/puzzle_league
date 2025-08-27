import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';
import { RequestCreateWithoutCompetitionInputSchema } from './RequestCreateWithoutCompetitionInputSchema';
import { RequestUncheckedCreateWithoutCompetitionInputSchema } from './RequestUncheckedCreateWithoutCompetitionInputSchema';

export const RequestCreateOrConnectWithoutCompetitionInputSchema: z.ZodType<Prisma.RequestCreateOrConnectWithoutCompetitionInput> = z.object({
  where: z.lazy(() => RequestWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RequestCreateWithoutCompetitionInputSchema),z.lazy(() => RequestUncheckedCreateWithoutCompetitionInputSchema) ]),
}).strict();

export default RequestCreateOrConnectWithoutCompetitionInputSchema;
