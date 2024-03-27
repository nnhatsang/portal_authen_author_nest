import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import JwtRefreshGuard from './auth.guard.access';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginUserDto } from './dto/login.dto';
import { RefreshTokenStrategy } from './strategy/refreshToken.strategy';

// export const User = createParamDecorator(
//   (data: string, ctx: ExecutionContext) => {
//     const request = ctx.switchToHttp().getRequest();
//     const user = request.user;

//     return data ? user?.[data] : user;
//   },
// );
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtSer: JwtService,
  ) { }

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
  @UseGuards(RefreshTokenStrategy)
  @Post('refresh-token')
  refreshAccessToken(@Req() request: Request) {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      return
      // throw new Error('Authorization token is missing or invalid.');
    }

    const { username, key } = this.jwtSer.decode(token) ?? {};

    if (!username || !key) {
      throw new Error('Token payload is invalid.');
    }

    return this.authService.refreshAccessToken(username, key);
  }
}
