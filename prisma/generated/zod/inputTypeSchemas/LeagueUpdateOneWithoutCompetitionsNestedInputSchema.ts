import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueCreateWithoutCompetitionsInputSchema } from './LeagueCreateWithoutCompetitionsInputSchema';
import { LeagueUncheckedCreateWithoutCompetitionsInputSchema } from './LeagueUncheckedCreateWithoutCompetitionsInputSchema';
import { LeagueCreateOrConnectWithoutCompetitionsInputSchema } from './LeagueCreateOrConnectWithoutCompetitionsInputSchema';
import { LeagueUpsertWithoutCompetitionsInputSchema } from './LeagueUpsertWithoutCompetitionsInputSchema';
import { LeagueWhereInputSchema } from './LeagueWhereInputSchema';
import { LeagueWhereUniqueInputSchema } from './LeagueWhereUniqueInputSchema';
import { LeagueUpdateToOneWithWhereWithoutCompetitionsInputSchema } from './LeagueUpdateToOneWithWhereWithoutCompetitionsInputSchema';
import { LeagueUpdateWithoutCompetitionsInputSchema } from './LeagueUpdateWithoutCompetitionsInputSchema';
import { LeagueUncheckedUpdateWithoutCompetitionsInputSchema } from './LeagueUncheckedUpdateWithoutCompetitionsInputSchema';

export const LeagueUpdateOneWithoutCompetitionsNestedInputSchema: z.ZodType<Prisma.LeagueUpdateOneWithoutCompetitionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => LeagueCreateWithoutCompetitionsInputSchema),z.lazy(() => LeagueUncheckedCreateWithoutCompetitionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => LeagueCreateOrConnectWithoutCompetitionsInputSchema).optional(),
  upsert: z.lazy(() => LeagueUpsertWithoutCompetitionsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => LeagueWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => LeagueWhereInputSchema) ]).optional(),
  connect: z.lazy(() => LeagueWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => LeagueUpdateToOneWithWhereWithoutCompetitionsInputSchema),z.lazy(() => LeagueUpdateWithoutCompetitionsInputSchema),z.lazy(() => LeagueUncheckedUpdateWithoutCompetitionsInputSchema) ]).optional(),
}).strict();

export default LeagueUpdateOneWithoutCompetitionsNestedInputSchema;
