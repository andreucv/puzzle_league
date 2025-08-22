import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereUniqueInputSchema } from './CompetitionWhereUniqueInputSchema';
import { CompetitionUpdateWithoutLeagueInputSchema } from './CompetitionUpdateWithoutLeagueInputSchema';
import { CompetitionUncheckedUpdateWithoutLeagueInputSchema } from './CompetitionUncheckedUpdateWithoutLeagueInputSchema';
import { CompetitionCreateWithoutLeagueInputSchema } from './CompetitionCreateWithoutLeagueInputSchema';
import { CompetitionUncheckedCreateWithoutLeagueInputSchema } from './CompetitionUncheckedCreateWithoutLeagueInputSchema';

export const CompetitionUpsertWithWhereUniqueWithoutLeagueInputSchema: z.ZodType<Prisma.CompetitionUpsertWithWhereUniqueWithoutLeagueInput> = z.object({
  where: z.lazy(() => CompetitionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CompetitionUpdateWithoutLeagueInputSchema),z.lazy(() => CompetitionUncheckedUpdateWithoutLeagueInputSchema) ]),
  create: z.union([ z.lazy(() => CompetitionCreateWithoutLeagueInputSchema),z.lazy(() => CompetitionUncheckedCreateWithoutLeagueInputSchema) ]),
}).strict();

export default CompetitionUpsertWithWhereUniqueWithoutLeagueInputSchema;
