import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutLeagueInputSchema } from './CompetitionCreateWithoutLeagueInputSchema';
import { CompetitionUncheckedCreateWithoutLeagueInputSchema } from './CompetitionUncheckedCreateWithoutLeagueInputSchema';
import { CompetitionCreateOrConnectWithoutLeagueInputSchema } from './CompetitionCreateOrConnectWithoutLeagueInputSchema';
import { CompetitionUpsertWithWhereUniqueWithoutLeagueInputSchema } from './CompetitionUpsertWithWhereUniqueWithoutLeagueInputSchema';
import { CompetitionCreateManyLeagueInputEnvelopeSchema } from './CompetitionCreateManyLeagueInputEnvelopeSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionUpdateWithWhereUniqueWithoutLeagueInputSchema } from './CompetitionUpdateWithWhereUniqueWithoutLeagueInputSchema';
import { CompetitionUpdateManyWithWhereWithoutLeagueInputSchema } from './CompetitionUpdateManyWithWhereWithoutLeagueInputSchema';
import { CompetitionScalarWhereInputSchema } from './CompetitionScalarWhereInputSchema';

export const CompetitionUncheckedUpdateManyWithoutLeagueNestedInputSchema: z.ZodType<Prisma.CompetitionUncheckedUpdateManyWithoutLeagueNestedInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutLeagueInputSchema),z.lazy(() => CompetitionCreateWithoutLeagueInputSchema).array(),z.lazy(() => CompetitionUncheckedCreateWithoutLeagueInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutLeagueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CompetitionCreateOrConnectWithoutLeagueInputSchema),z.lazy(() => CompetitionCreateOrConnectWithoutLeagueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CompetitionUpsertWithWhereUniqueWithoutLeagueInputSchema),z.lazy(() => CompetitionUpsertWithWhereUniqueWithoutLeagueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CompetitionCreateManyLeagueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CompetitionUpdateWithWhereUniqueWithoutLeagueInputSchema),z.lazy(() => CompetitionUpdateWithWhereUniqueWithoutLeagueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CompetitionUpdateManyWithWhereWithoutLeagueInputSchema),z.lazy(() => CompetitionUpdateManyWithWhereWithoutLeagueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CompetitionScalarWhereInputSchema),z.lazy(() => CompetitionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default CompetitionUncheckedUpdateManyWithoutLeagueNestedInputSchema;
