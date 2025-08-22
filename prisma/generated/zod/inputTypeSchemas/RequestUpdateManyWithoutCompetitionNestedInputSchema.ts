import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestCreateWithoutCompetitionInputSchema } from './RequestCreateWithoutCompetitionInputSchema';
import { RequestUncheckedCreateWithoutCompetitionInputSchema } from './RequestUncheckedCreateWithoutCompetitionInputSchema';
import { RequestCreateOrConnectWithoutCompetitionInputSchema } from './RequestCreateOrConnectWithoutCompetitionInputSchema';
import { RequestUpsertWithWhereUniqueWithoutCompetitionInputSchema } from './RequestUpsertWithWhereUniqueWithoutCompetitionInputSchema';
import { RequestCreateManyCompetitionInputEnvelopeSchema } from './RequestCreateManyCompetitionInputEnvelopeSchema';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';
import { RequestUpdateWithWhereUniqueWithoutCompetitionInputSchema } from './RequestUpdateWithWhereUniqueWithoutCompetitionInputSchema';
import { RequestUpdateManyWithWhereWithoutCompetitionInputSchema } from './RequestUpdateManyWithWhereWithoutCompetitionInputSchema';
import { RequestScalarWhereInputSchema } from './RequestScalarWhereInputSchema';

export const RequestUpdateManyWithoutCompetitionNestedInputSchema: z.ZodType<Prisma.RequestUpdateManyWithoutCompetitionNestedInput> = z.object({
  create: z.union([ z.lazy(() => RequestCreateWithoutCompetitionInputSchema),z.lazy(() => RequestCreateWithoutCompetitionInputSchema).array(),z.lazy(() => RequestUncheckedCreateWithoutCompetitionInputSchema),z.lazy(() => RequestUncheckedCreateWithoutCompetitionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RequestCreateOrConnectWithoutCompetitionInputSchema),z.lazy(() => RequestCreateOrConnectWithoutCompetitionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RequestUpsertWithWhereUniqueWithoutCompetitionInputSchema),z.lazy(() => RequestUpsertWithWhereUniqueWithoutCompetitionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RequestCreateManyCompetitionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RequestUpdateWithWhereUniqueWithoutCompetitionInputSchema),z.lazy(() => RequestUpdateWithWhereUniqueWithoutCompetitionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RequestUpdateManyWithWhereWithoutCompetitionInputSchema),z.lazy(() => RequestUpdateManyWithWhereWithoutCompetitionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RequestScalarWhereInputSchema),z.lazy(() => RequestScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default RequestUpdateManyWithoutCompetitionNestedInputSchema;
