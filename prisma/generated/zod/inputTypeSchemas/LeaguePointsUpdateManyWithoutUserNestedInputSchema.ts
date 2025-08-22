import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsCreateWithoutUserInputSchema } from './LeaguePointsCreateWithoutUserInputSchema';
import { LeaguePointsUncheckedCreateWithoutUserInputSchema } from './LeaguePointsUncheckedCreateWithoutUserInputSchema';
import { LeaguePointsCreateOrConnectWithoutUserInputSchema } from './LeaguePointsCreateOrConnectWithoutUserInputSchema';
import { LeaguePointsUpsertWithWhereUniqueWithoutUserInputSchema } from './LeaguePointsUpsertWithWhereUniqueWithoutUserInputSchema';
import { LeaguePointsCreateManyUserInputEnvelopeSchema } from './LeaguePointsCreateManyUserInputEnvelopeSchema';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';
import { LeaguePointsUpdateWithWhereUniqueWithoutUserInputSchema } from './LeaguePointsUpdateWithWhereUniqueWithoutUserInputSchema';
import { LeaguePointsUpdateManyWithWhereWithoutUserInputSchema } from './LeaguePointsUpdateManyWithWhereWithoutUserInputSchema';
import { LeaguePointsScalarWhereInputSchema } from './LeaguePointsScalarWhereInputSchema';

export const LeaguePointsUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.LeaguePointsUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => LeaguePointsCreateWithoutUserInputSchema),z.lazy(() => LeaguePointsCreateWithoutUserInputSchema).array(),z.lazy(() => LeaguePointsUncheckedCreateWithoutUserInputSchema),z.lazy(() => LeaguePointsUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LeaguePointsCreateOrConnectWithoutUserInputSchema),z.lazy(() => LeaguePointsCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => LeaguePointsUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => LeaguePointsUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => LeaguePointsCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => LeaguePointsUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => LeaguePointsUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => LeaguePointsUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => LeaguePointsUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => LeaguePointsScalarWhereInputSchema),z.lazy(() => LeaguePointsScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default LeaguePointsUpdateManyWithoutUserNestedInputSchema;
