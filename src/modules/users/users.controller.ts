import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
// import { RefreshTokenGuard } from '../auth/auth.guard.access';
export const JwtGuard = applyDecorators(UseGuards(AuthGuard('jwt')));
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(AuthGuard('jwt'))
  @Get('info-user')
  async getInfoUser(@Req() request: Request) {
    // await this.userService.getInfoUser(request.user.ID);
    const username = (request.user as any).username;

    return this.usersService.findUser(username);
  }
  @UseGuards(JwtStrategy)
  @Post('logout')
  async logout(@Req() request: Request) {
    // await this.userService.getInfoUser(request.user.ID);
    const username = (request.user as any).username;

    return this.usersService.logout(username);
  }
}
