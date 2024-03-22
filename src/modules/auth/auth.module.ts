import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategy/jwt.strategy';
import { RefreshTokenStrategy } from './strategy/refreshToken.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '10s' },
      }),
      inject: [ConfigService], 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy,RefreshTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
