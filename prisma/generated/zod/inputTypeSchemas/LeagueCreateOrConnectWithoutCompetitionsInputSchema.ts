import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueWhereUniqueInputSchema } from './LeagueWhereUniqueInputSchema';
import { LeagueCreateWithoutCompetitionsInputSchema } from './LeagueCreateWithoutCompetitionsInputSchema';
import { LeagueUncheckedCreateWithoutCompetitionsInputSchema } from './LeagueUncheckedCreateWithoutCompetitionsInputSchema';

export const LeagueCreateOrConnectWithoutCompetitionsInputSchema: z.ZodType<Prisma.LeagueCreateOrConnectWithoutCompetitionsInput> = z.object({
  where: z.lazy(() => LeagueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => LeagueCreateWithoutCompetitionsInputSchema),z.lazy(() => LeagueUncheckedCreateWithoutCompetitionsInputSchema) ]),
}).strict();

export default LeagueCreateOrConnectWithoutCompetitionsInputSchema;
