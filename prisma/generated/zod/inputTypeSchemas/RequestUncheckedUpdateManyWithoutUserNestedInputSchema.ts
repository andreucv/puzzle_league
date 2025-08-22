import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestCreateWithoutUserInputSchema } from './RequestCreateWithoutUserInputSchema';
import { RequestUncheckedCreateWithoutUserInputSchema } from './RequestUncheckedCreateWithoutUserInputSchema';
import { RequestCreateOrConnectWithoutUserInputSchema } from './RequestCreateOrConnectWithoutUserInputSchema';
import { RequestUpsertWithWhereUniqueWithoutUserInputSchema } from './RequestUpsertWithWhereUniqueWithoutUserInputSchema';
import { RequestCreateManyUserInputEnvelopeSchema } from './RequestCreateManyUserInputEnvelopeSchema';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';
import { RequestUpdateWithWhereUniqueWithoutUserInputSchema } from './RequestUpdateWithWhereUniqueWithoutUserInputSchema';
import { RequestUpdateManyWithWhereWithoutUserInputSchema } from './RequestUpdateManyWithWhereWithoutUserInputSchema';
import { RequestScalarWhereInputSchema } from './RequestScalarWhereInputSchema';

export const RequestUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.RequestUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => RequestCreateWithoutUserInputSchema),z.lazy(() => RequestCreateWithoutUserInputSchema).array(),z.lazy(() => RequestUncheckedCreateWithoutUserInputSchema),z.lazy(() => RequestUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RequestCreateOrConnectWithoutUserInputSchema),z.lazy(() => RequestCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RequestUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => RequestUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RequestCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RequestWhereUniqueInputSchema),z.lazy(() => RequestWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RequestUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => RequestUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RequestUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => RequestUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RequestScalarWhereInputSchema),z.lazy(() => RequestScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default RequestUncheckedUpdateManyWithoutUserNestedInputSchema;
