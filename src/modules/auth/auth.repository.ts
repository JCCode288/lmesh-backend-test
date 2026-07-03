import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByUsername(username: string) {
        return this.prisma.users.findUnique({ where: { username } });
    }
}
