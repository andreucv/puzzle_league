import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateWithoutRecordsInputSchema } from './UserUpdateWithoutRecordsInputSchema';
import { UserUncheckedUpdateWithoutRecordsInputSchema } from './UserUncheckedUpdateWithoutRecordsInputSchema';

export const UserUpdateWithWhereUniqueWithoutRecordsInputSchema: z.ZodType<Prisma.UserUpdateWithWhereUniqueWithoutRecordsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => UserUpdateWithoutRecordsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutRecordsInputSchema) ]),
}).strict();

export default UserUpdateWithWhereUniqueWithoutRecordsInputSchema;
