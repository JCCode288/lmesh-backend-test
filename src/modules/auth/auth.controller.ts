import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ResponseMessage } from 'src/commons/decorators/ResponseMessage.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authSvc: AuthService) {}

  /**
   * @description used for login authentication for app.
   * @param {LoginDto} dto body payload for login
   */
  @Post('login')
  @ResponseMessage('Login successful')
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authSvc.login(dto);
  }
}
