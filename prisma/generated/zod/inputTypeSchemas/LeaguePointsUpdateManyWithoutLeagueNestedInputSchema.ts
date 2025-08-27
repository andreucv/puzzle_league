import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsCreateWithoutLeagueInputSchema } from './LeaguePointsCreateWithoutLeagueInputSchema';
import { LeaguePointsUncheckedCreateWithoutLeagueInputSchema } from './LeaguePointsUncheckedCreateWithoutLeagueInputSchema';
import { LeaguePointsCreateOrConnectWithoutLeagueInputSchema } from './LeaguePointsCreateOrConnectWithoutLeagueInputSchema';
import { LeaguePointsUpsertWithWhereUniqueWithoutLeagueInputSchema } from './LeaguePointsUpsertWithWhereUniqueWithoutLeagueInputSchema';
import { LeaguePointsCreateManyLeagueInputEnvelopeSchema } from './LeaguePointsCreateManyLeagueInputEnvelopeSchema';
import { LeaguePointsWhereUniqueInputSchema } from './LeaguePointsWhereUniqueInputSchema';
import { LeaguePointsUpdateWithWhereUniqueWithoutLeagueInputSchema } from './LeaguePointsUpdateWithWhereUniqueWithoutLeagueInputSchema';
import { LeaguePointsUpdateManyWithWhereWithoutLeagueInputSchema } from './LeaguePointsUpdateManyWithWhereWithoutLeagueInputSchema';
import { LeaguePointsScalarWhereInputSchema } from './LeaguePointsScalarWhereInputSchema';

export const LeaguePointsUpdateManyWithoutLeagueNestedInputSchema: z.ZodType<Prisma.LeaguePointsUpdateManyWithoutLeagueNestedInput> = z.object({
  create: z.union([ z.lazy(() => LeaguePointsCreateWithoutLeagueInputSchema),z.lazy(() => LeaguePointsCreateWithoutLeagueInputSchema).array(),z.lazy(() => LeaguePointsUncheckedCreateWithoutLeagueInputSchema),z.lazy(() => LeaguePointsUncheckedCreateWithoutLeagueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => LeaguePointsCreateOrConnectWithoutLeagueInputSchema),z.lazy(() => LeaguePointsCreateOrConnectWithoutLeagueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => LeaguePointsUpsertWithWhereUniqueWithoutLeagueInputSchema),z.lazy(() => LeaguePointsUpsertWithWhereUniqueWithoutLeagueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => LeaguePointsCreateManyLeagueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => LeaguePointsWhereUniqueInputSchema),z.lazy(() => LeaguePointsWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => LeaguePointsUpdateWithWhereUniqueWithoutLeagueInputSchema),z.lazy(() => LeaguePointsUpdateWithWhereUniqueWithoutLeagueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => LeaguePointsUpdateManyWithWhereWithoutLeagueInputSchema),z.lazy(() => LeaguePointsUpdateManyWithWhereWithoutLeagueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => LeaguePointsScalarWhereInputSchema),z.lazy(() => LeaguePointsScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default LeaguePointsUpdateManyWithoutLeagueNestedInputSchema;
