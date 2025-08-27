import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionCreateWithoutLeagueInputSchema } from './CompetitionCreateWithoutLeagueInputSchema';
import { CompetitionUncheckedCreateWithoutLeagueInputSchema } from './CompetitionUncheckedCreateWithoutLeagueInputSchema';

export const CompetitionCreateOrConnectWithoutLeagueInputSchema: z.ZodType<Prisma.CompetitionCreateOrConnectWithoutLeagueInput> = z.object({
  where: z.lazy(() => CompetitionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutLeagueInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutLeagueInputSchema) ]),
}).strict();

export default CompetitionCreateOrConnectWithoutLeagueInputSchema;
