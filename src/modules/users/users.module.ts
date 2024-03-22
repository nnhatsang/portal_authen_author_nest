import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RefreshTokenGuard } from '../auth/auth.guard.access';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[JwtModule],
  controllers: [UsersController],
  providers: [UsersService,RefreshTokenGuard],
  exports: [UsersService],
})
export class UsersModule {}
