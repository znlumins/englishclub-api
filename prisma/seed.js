import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password_hash = await bcrypt.hash('password123', 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vokasi.ac.id' },
    update: {},
    create: {
      email: 'admin@vokasi.ac.id',
      nim: '1111111111',
      full_name: 'Administrator',
      password_hash,
      role: 'admin',
      status: 'active'
    },
  });

  // Create Instructor
  const instructor = await prisma.user.upsert({
    where: { email: 'dosen@vokasi.ac.id' },
    update: {},
    create: {
      email: 'dosen@vokasi.ac.id',
      nim: '2222222222',
      full_name: 'Ibu Dosen Pengajar',
      password_hash,
      role: 'instructor',
      status: 'active'
    },
  });

  // Create Member
  const member = await prisma.user.upsert({
    where: { email: 'mahasiswa@vokasi.ac.id' },
    update: {},
    create: {
      email: 'mahasiswa@vokasi.ac.id',
      nim: '3333333333',
      full_name: 'Mahasiswa Aktif',
      password_hash,
      role: 'member',
      status: 'active'
    },
  });

  console.log('Seeding finished!');
  console.log({ admin: admin.email, instructor: instructor.email, member: member.email });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
