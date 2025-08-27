import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueUpdateWithoutCompetitionsInputSchema } from './LeagueUpdateWithoutCompetitionsInputSchema';
import { LeagueUncheckedUpdateWithoutCompetitionsInputSchema } from './LeagueUncheckedUpdateWithoutCompetitionsInputSchema';
import { LeagueCreateWithoutCompetitionsInputSchema } from './LeagueCreateWithoutCompetitionsInputSchema';
import { LeagueUncheckedCreateWithoutCompetitionsInputSchema } from './LeagueUncheckedCreateWithoutCompetitionsInputSchema';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';

export const LeagueUpsertWithoutCompetitionsInputSchema: z.ZodType<Prisma.LeagueUpsertWithoutCompetitionsInput> = z.object({
  update: z.union([ z.lazy(() => LeagueUpdateWithoutCompetitionsInputSchema),z.lazy(() => LeagueUncheckedUpdateWithoutCompetitionsInputSchema) ]),
  create: z.union([ z.lazy(() => LeagueCreateWithoutCompetitionsInputSchema),z.lazy(() => LeagueUncheckedCreateWithoutCompetitionsInputSchema) ]),
  where: z.lazy(() => LeagueWhereInputSchema).optional()
}).strict();

export default LeagueUpsertWithoutCompetitionsInputSchema;
