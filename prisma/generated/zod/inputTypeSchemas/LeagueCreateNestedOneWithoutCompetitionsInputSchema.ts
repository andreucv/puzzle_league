import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueCreateWithoutCompetitionsInputSchema } from './LeagueCreateWithoutCompetitionsInputSchema';
import { LeagueUncheckedCreateWithoutCompetitionsInputSchema } from './LeagueUncheckedCreateWithoutCompetitionsInputSchema';
import { LeagueCreateOrConnectWithoutCompetitionsInputSchema } from './LeagueCreateOrConnectWithoutCompetitionsInputSchema';
import { LeagueWhereUniqueInputSchema } from './LeagueWhereUniqueInputSchema';

export const LeagueCreateNestedOneWithoutCompetitionsInputSchema: z.ZodType<Prisma.LeagueCreateNestedOneWithoutCompetitionsInput> = z.object({
  create: z.union([ z.lazy(() => LeagueCreateWithoutCompetitionsInputSchema),z.lazy(() => LeagueUncheckedCreateWithoutCompetitionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => LeagueCreateOrConnectWithoutCompetitionsInputSchema).optional(),
  connect: z.lazy(() => LeagueWhereUniqueInputSchema).optional()
}).strict();

export default LeagueCreateNestedOneWithoutCompetitionsInputSchema;
