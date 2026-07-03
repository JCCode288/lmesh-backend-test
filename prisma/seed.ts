import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SEED_PASSWORD = 'password123';

async function main() {
    const password = await bcrypt.hash(SEED_PASSWORD, 10);
    const usernames = ['alice', 'bob'];

    for (const username of usernames) {
        await prisma.users.upsert({
            where: { username },
            update: {},
            create: { username, password },
        });
    }

    console.log(`Seeded users: ${usernames.join(', ')} (password: ${SEED_PASSWORD})`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
