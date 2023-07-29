import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportBikesData() {
  const bikesData = (await prisma.bike.findMany({
    include: {
      MileageUpdate: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1,
      },
      Event: {
        orderBy: {
          createdAt: 'desc'
        },
      },
      Component: {
        orderBy: {
          createdAt: 'desc'
        },
      }
    }
  }))

  // Write the data to a file
  const bikesDataJSON = JSON.stringify(bikesData, null, 2);
  fs.writeFileSync('src/data/bikes.json', bikesDataJSON);

  console.log('Data exported to bikes.json successfully.');
}

exportBikesData()
  .catch((error) => {
    console.error('Error exporting data:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });
