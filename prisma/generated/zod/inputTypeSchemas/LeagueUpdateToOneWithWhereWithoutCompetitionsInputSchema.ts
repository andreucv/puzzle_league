import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';
import { LeagueUpdateWithoutCompetitionsInputSchema } from './LeagueUpdateWithoutCompetitionsInputSchema';
import { LeagueUncheckedUpdateWithoutCompetitionsInputSchema } from './LeagueUncheckedUpdateWithoutCompetitionsInputSchema';

export const LeagueUpdateToOneWithWhereWithoutCompetitionsInputSchema: z.ZodType<Prisma.LeagueUpdateToOneWithWhereWithoutCompetitionsInput> = z.object({
  where: z.lazy(() => LeagueWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => LeagueUpdateWithoutCompetitionsInputSchema),z.lazy(() => LeagueUncheckedUpdateWithoutCompetitionsInputSchema) ]),
}).strict();

export default LeagueUpdateToOneWithWhereWithoutCompetitionsInputSchema;
