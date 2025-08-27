import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateWithoutLeagueInputSchema } from './CompetitionCreateWithoutLeagueInputSchema';
import { CompetitionUncheckedCreateWithoutLeagueInputSchema } from './CompetitionUncheckedCreateWithoutLeagueInputSchema';
import { CompetitionCreateOrConnectWithoutLeagueInputSchema } from './CompetitionCreateOrConnectWithoutLeagueInputSchema';
import { CompetitionCreateManyLeagueInputEnvelopeSchema } from './CompetitionCreateManyLeagueInputEnvelopeSchema';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';

export const CompetitionCreateNestedManyWithoutLeagueInputSchema: z.ZodType<Prisma.CompetitionCreateNestedManyWithoutLeagueInput> = z.object({
  create: z.union([ z.lazy(() => CompetitionCreateWithoutLeagueInputSchema),z.lazy(() => CompetitionCreateWithoutLeagueInputSchema).array(),z.lazy(() => CompetitionUncheckedCreateWithoutLeagueInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutLeagueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CompetitionCreateOrConnectWithoutLeagueInputSchema),z.lazy(() => CompetitionCreateOrConnectWithoutLeagueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CompetitionCreateManyLeagueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CompetitionWhereUniqueInputSchema),z.lazy(() => CompetitionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default CompetitionCreateNestedManyWithoutLeagueInputSchema;
