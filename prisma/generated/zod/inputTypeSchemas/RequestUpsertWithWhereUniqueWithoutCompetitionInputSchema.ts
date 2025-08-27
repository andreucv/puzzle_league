import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestWhereUniqueInputSchema } from './RequestWhereUniqueInputSchema';
import { RequestUpdateWithoutCompetitionInputSchema } from './RequestUpdateWithoutCompetitionInputSchema';
import { RequestUncheckedUpdateWithoutCompetitionInputSchema } from './RequestUncheckedUpdateWithoutCompetitionInputSchema';
import { RequestCreateWithoutCompetitionInputSchema } from './RequestCreateWithoutCompetitionInputSchema';
import { RequestUncheckedCreateWithoutCompetitionInputSchema } from './RequestUncheckedCreateWithoutCompetitionInputSchema';

export const RequestUpsertWithWhereUniqueWithoutCompetitionInputSchema: z.ZodType<Prisma.RequestUpsertWithWhereUniqueWithoutCompetitionInput> = z.object({
  where: z.lazy(() => RequestWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RequestUpdateWithoutCompetitionInputSchema),z.lazy(() => RequestUncheckedUpdateWithoutCompetitionInputSchema) ]),
  create: z.union([ z.lazy(() => RequestCreateWithoutCompetitionInputSchema),z.lazy(() => RequestUncheckedCreateWithoutCompetitionInputSchema) ]),
}).strict();

export default RequestUpsertWithWhereUniqueWithoutCompetitionInputSchema;
