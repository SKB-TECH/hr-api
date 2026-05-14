// import { PrismaClient, EmploymentType, ExperienceLevel } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Seeding database...');

//   // 1. Create a Hero Image
//   await prisma.heroImage.create({
//     data: {
//       secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
//       publicId: 'sample',
//       isActive: true,
//     },
//   });
//   console.log('Hero image seeded');

//   // 2. Create 15 Sample Jobs
//   const jobsData = Array.from({ length: 15 }).map((_, index) => {
//     const isEven = index % 2 === 0;
//     return {
//       title: `Software Engineer ${index + 1}`,
//       slug: `software-engineer-${index + 1}`,
//       location: isEven ? 'Kigali, Rwanda' : 'Remote',
//       salaryMin: 50000 + (index * 1000),
//       salaryMax: 80000 + (index * 1000),
//       description: `<h3>About the Role</h3><p>We are looking for a Software Engineer ${index + 1} to join our team and help us build scalable enterprise applications.</p><ul><li>Write clean, testable code</li><li>Collaborate with cross-functional teams</li></ul>`,
//       shortDescription: `Great opportunity for a Software Engineer ${index + 1} to build enterprise apps.`,
//       employmentType: isEven ? EmploymentType.FULL_TIME : EmploymentType.REMOTE,
//       experienceLevel: isEven ? ExperienceLevel.MID : ExperienceLevel.SENIOR,
//       companyName: 'Infinity Tech Innovation',
//       isPublished: true,
//       applicationUrl: 'https://infinitytech.example.com/apply',
//       deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month from now
//     };
//   });

//   await prisma.job.createMany({
//     data: jobsData,
//   });

//   console.log('15 Jobs seeded');
//   console.log('Database seeded successfully!');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
