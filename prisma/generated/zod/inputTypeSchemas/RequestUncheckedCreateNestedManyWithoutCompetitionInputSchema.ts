import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestCreateWithoutCompetitionInputSchema } from './RequestCreateWithoutCompetitionInputSchema';
import { RequestUncheckedCreateWithoutCompetitionInputSchema } from './RequestUncheckedCreateWithoutCompetitionInputSchema';
import { RequestCreateOrConnectWithoutCompetitionInputSchema } from './RequestCreateOrConnectWithoutCompetitionInputSchema';
import { RequestCreateManyCompetitionInputEnvelopeSchema } from './RequestCreateManyCompetitionInputEnvelopeSchema';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';

export const RequestUncheckedCreateNestedManyWithoutCompetitionInputSchema: z.ZodType<Prisma.RequestUncheckedCreateNestedManyWithoutCompetitionInput> = z.object({
  create: z.union([ z.lazy(() => RequestCreateWithoutCompetitionInputSchema),z.lazy(() => RequestCreateWithoutCompetitionInputSchema).array(),z.lazy(() => RequestUncheckedCreateWithoutCompetitionInputSchema),z.lazy(() => RequestUncheckedCreateWithoutCompetitionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RequestCreateOrConnectWithoutCompetitionInputSchema),z.lazy(() => RequestCreateOrConnectWithoutCompetitionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RequestCreateManyCompetitionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default RequestUncheckedCreateNestedManyWithoutCompetitionInputSchema;
