import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class RefreshTokenGuard  extends AuthGuard('jwt-refresh'){
  constructor(private jwtService: JwtService,
    private config:ConfigService) {    super(); // Gọi super() để thực thi constructor của AuthGuard
}


  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Giả sử refresh token được gửi qua header `Authorization`
    const refreshToken = request.headers.authorization?.split(' ')[1];

    if (!refreshToken) {
      throw new UnauthorizedException("Không có refresh token");
    }

    try {
      // Giải mã và xác thực refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, { secret: this.config.get<string>('JWT_REFRESH_TOKEN_SECRET')  ,ignoreExpiration: true});
    //   console.log(payload)
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn");
    }
  }
  
}


