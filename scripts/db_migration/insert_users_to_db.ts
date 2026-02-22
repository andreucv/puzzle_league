import { PrismaClient, Role } from '../../src/lib/.prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { auth } from "../../src/lib/auth";

function createPrismaClient() {
    const url = process.env.DATABASE_URL!;
    if (url.startsWith('prisma+postgres://')) {
        return new PrismaClient({ accelerateUrl: url });
    }
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
}
const prisma = createPrismaClient()

async function main() {
  const users = [
    {
      email: process.env.TEST_PARTICIPANT_USER_EMAIL!,
      password: process.env.TEST_PARTICIPANT_USER_PASSWORD!,
      name: 'Test Participant',
      role: 'PARTICIPANT'
    },
    {
      email: process.env.TEST_ORGANIZER_USER_EMAIL!,
      password: process.env.TEST_ORGANIZER_USER_PASSWORD!,
      name: 'Test Organizer',
      role: 'ORGANIZER'
    },
    {
      email: process.env.TEST_ADMIN_USER_EMAIL!,
      password: process.env.TEST_ADMIN_USER_PASSWORD!,
      name: 'Test Admin',
      role: 'ADMIN'
    }
  ]

  for (const userData of users) {
    try {
        console.log(`Creating user ${userData.email} with password ${userData.password}`)
        const { headers, response } = await auth.api.signUpEmail({
            returnHeaders: true,
            body: {
                name: userData.name,
                email: userData.email,
                password: userData.password
            }
        })
        console.log("api.signUpEmail response", response)

        const user = await prisma.user.findUnique({
            where: {
                email: userData.email
            }
        });
        console.log(`✅ Created/Updated user: ${user}`)
        const roleAssignment = await prisma.roleAssignment.create({
            data: {
                userId: user?.id as string,
                role: userData?.role as Role,
            }
        });
      console.log(`✅ Created/Updated ${userData.role}: ${userData.email}`)
    } catch (error) {
      console.error(`❌ Failed to create ${userData.role}: ${error}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
