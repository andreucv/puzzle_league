import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = [
    {
      email: process.env.PROD_ADMIN_USER_EMAIL!,
    },
  ]

  for (const userData of users) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: userData.email
            }
        });
        const roleAssignment = await prisma.roleAssignment.create({
            data: {
                userId: user?.id as string,
                role: 'ADMIN' as Role,
            }
        });
      console.log(`✅ Created/Updated ADMIN: ${userData.email}`)
    } catch (error) {
      console.error(`❌ Failed to create ADMIN: ${error}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
