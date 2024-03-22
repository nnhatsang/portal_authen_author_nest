import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  createParamDecorator,
  ExecutionContext,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginUserDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtGuard } from '../users/users.controller';
import { Request } from 'express';
import { RefreshTokenGuard } from './auth.guard.access';

// export const User = createParamDecorator(
//   (data: string, ctx: ExecutionContext) => {
//     const request = ctx.switchToHttp().getRequest();
//     const user = request.user;

//     return data ? user?.[data] : user;
//   },
// );
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(ValidationPipe)
  login(@Body() loginDto: LoginUserDto): Promise<any> {
    return this.authService.login(loginDto);
  }

  @Post('regisCa')
  async regisCandidate(@Body() registerDto: CreateAuthDto) {
    return this.authService.signUp(registerDto);
  }
    // @JwtGuard
    @UseGuards(RefreshTokenGuard)
  @Post('refresh-token')  
refreshAccessToken(@Req() request: Request) {
        const username = (request.user as any).username;
        const key = (request.user as any).key;

    return this.authService.refreshToken(username, key);
  }
}
