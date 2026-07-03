import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UnauthorizedException } from 'src/commons/exceptions/UnauthorizedException';
import { ErrorCode } from 'src/commons/enums/error-code.enums';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly authRepo: AuthRepository,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(username: string, password: string) {
        const user = await this.authRepo.findByUsername(username);
        const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !passwordMatches)
            throw new UnauthorizedException('Invalid username or password', ErrorCode.INVALID_CREDENTIALS);


        const { password: _, ...safeUser } = user;
        return safeUser;
    }

    async login(dto: LoginDto): Promise<{ access_token: string }> {
        const user = await this.validateUser(dto.username, dto.password);
        const payload: JwtPayload = { sub: user.id, username: user.username };
        const access_token = await this.jwtService.signAsync(payload);

        this.logger.log(`User ${user.username} (#${user.id}) logged in`);
        return { access_token };
    }
}
