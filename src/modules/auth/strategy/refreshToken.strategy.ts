import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy,'jwt-refresh-token')  {
  constructor(
  private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,

  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request):any => {
          if (
            request.headers.authorization &&
            typeof request.headers.authorization === 'string' &&
            request.headers.authorization.split(' ')[0] === 'Bearer'
          ) {
         return request.headers.authorization.split(' ')[1];
          }
        },
      ]),
      secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }
  async validate(request:Request,payload:any):Promise<any>{    
    console.log(payload)
     return payload

  }
}