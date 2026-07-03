import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ResponseMessage } from 'src/commons/decorators/ResponseMessage.decorator';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authSvc: AuthService) { }

    @Post('login')
    @ResponseMessage('Login successful')
    async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
        return this.authSvc.login(dto);
    }
}
