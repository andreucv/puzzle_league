import { CategoryType } from '@prisma/client';
import { prisma } from './create_prisma_client';

async function main() {
  // First, let's check what competitions and categories exist
  const competitions = await prisma.competition.findMany({
    include: {
      categories: {
        include: {
          records: {
            include: {
              users: true
            }
          }
        }
      }
    }
  });

  console.log('Current competitions:', competitions.length);
  competitions.forEach((comp, index) => {
    console.log(`${index + 1}. ${comp.name} (ID: ${comp.id}) - Categories: ${comp.categories.length}`);
    comp.categories.forEach((cat, catIndex) => {
      console.log(`   ${catIndex + 1}. ${cat.description} (${cat.type}) - Entries: ${cat.records.length}`);
    });
  });

  if (competitions.length === 0) {
    console.log('No competitions found. Please create some competitions first.');
    return;
  }

  // Check available users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  console.log(`\nAvailable users: ${users.length}`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
  });

  if (users.length === 0) {
    console.log('No users found. Please run the user seeding script first.');
    return;
  }

  // Function to get random users for an entry based on category type
  function getRandomUsersForEntry(categoryType: CategoryType, allUsers: typeof users): typeof users {
    let maxUsers = 1;

    switch (categoryType) {
      case 'INDIVIDUAL':
      case 'JUNIOR_INDIVIDUAL':
      case 'PUZZLE_CHESS':
        maxUsers = 1;
        break;
      case 'PAIRS':
      case 'JUNIOR_PAIRS':
        maxUsers = 2;
        break;
      case 'TEAM':
        maxUsers = Math.floor(Math.random() * 3) + 2; // 2-4 people for team
        break;
      case 'OTHER':
        maxUsers = Math.floor(Math.random() * 4) + 1; // 1-4 people for other
        break;
    }

    // Shuffle users and take the required number
    const shuffled = [...allUsers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(maxUsers, allUsers.length));
  }

  // Seed entries for each category
  for (const competition of competitions) {
    console.log(`\nSeeding entries for competition: ${competition.name}`);

    for (const category of competition.categories) {
      // Generate random number of entries (between 3 and 15)
      const numberOfEntries = Math.floor(Math.random() * 13) + 3;

      console.log(`  Creating ${numberOfEntries} entries for category: ${category.description} (${category.type})`);

      for (let i = 0; i < numberOfEntries; i++) {
        try {
          const entryUsers = getRandomUsersForEntry(category.type, users);
          const creator = entryUsers[0]; // First user is the creator

          // Check if this combination of users already exists for this category
          const existingEntry = await prisma.record.findFirst({
            where: {
              categoryId: category.id,
              users: {
                every: {
                  id: {
                    in: entryUsers.map(u => u.id)
                  }
                }
              }
            }
          });

          if (existingEntry) {
            console.log(`    Entry with these users already exists, skipping...`);
            continue;
          }

          const entry = await prisma.record.create({
            data: {
              categoryId: category.id,
              creatorId: creator.id,
              tableNumber: i, // Random table number between 1 and 10
              users: {
                connect: entryUsers.map(u => ({ id: u.id }))
              }
            },
            include: {
              users: true
            }
          });

          console.log(`    ✅ Created entry ${i + 1} with ${entry.users.length} user(s): ${entry.users.map(u => u.name).join(', ')}`);
        } catch (error) {
          console.error(`    ❌ Failed to create entry ${i + 1}:`, error);
        }
      }
    }
  }

  // Final summary
  console.log('\n=== SEEDING SUMMARY ===');
  const updatedCompetitions = await prisma.competition.findMany({
    include: {
      categories: {
        include: {
          _count: {
            select: {
              records: true
            }
          }
        }
      }
    }
  });

  updatedCompetitions.forEach(comp => {
    console.log(`${comp.name}:`);
    comp.categories.forEach(cat => {
      console.log(`  - ${cat.description} (${cat.type}): ${cat._count.records} entries`);
    });
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
