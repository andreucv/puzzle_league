import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueCreateWithoutLeaguePointsInputSchema } from './LeagueCreateWithoutLeaguePointsInputSchema';
import { LeagueUncheckedCreateWithoutLeaguePointsInputSchema } from './LeagueUncheckedCreateWithoutLeaguePointsInputSchema';
import { LeagueCreateOrConnectWithoutLeaguePointsInputSchema } from './LeagueCreateOrConnectWithoutLeaguePointsInputSchema';
import { LeagueUpsertWithoutLeaguePointsInputSchema } from './LeagueUpsertWithoutLeaguePointsInputSchema';
import { LeagueWhereUniqueInputSchema } from './LeagueWhereUniqueInputSchema';
import { LeagueUpdateToOneWithWhereWithoutLeaguePointsInputSchema } from './LeagueUpdateToOneWithWhereWithoutLeaguePointsInputSchema';
import { LeagueUpdateWithoutLeaguePointsInputSchema } from './LeagueUpdateWithoutLeaguePointsInputSchema';
import { LeagueUncheckedUpdateWithoutLeaguePointsInputSchema } from './LeagueUncheckedUpdateWithoutLeaguePointsInputSchema';

export const LeagueUpdateOneRequiredWithoutLeaguePointsNestedInputSchema: z.ZodType<Prisma.LeagueUpdateOneRequiredWithoutLeaguePointsNestedInput> = z.object({
  create: z.union([ z.lazy(() => LeagueCreateWithoutLeaguePointsInputSchema),z.lazy(() => LeagueUncheckedCreateWithoutLeaguePointsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => LeagueCreateOrConnectWithoutLeaguePointsInputSchema).optional(),
  upsert: z.lazy(() => LeagueUpsertWithoutLeaguePointsInputSchema).optional(),
  connect: z.lazy(() => LeagueWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => LeagueUpdateToOneWithWhereWithoutLeaguePointsInputSchema),z.lazy(() => LeagueUpdateWithoutLeaguePointsInputSchema),z.lazy(() => LeagueUncheckedUpdateWithoutLeaguePointsInputSchema) ]).optional(),
}).strict();

export default LeagueUpdateOneRequiredWithoutLeaguePointsNestedInputSchema;
