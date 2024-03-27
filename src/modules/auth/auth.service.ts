import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginUserDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { Prisma, PrismaClient } from '@prisma/client';
import * as argon from 'argon2';
import { ResponseData } from 'src/utils/response.utils';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    public jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  prisma = new PrismaClient();

  async login(loginDto: LoginUserDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { Username: loginDto.username },
    });
    if (!user)
      throw new HttpException('user is not exist', HttpStatus.UNAUTHORIZED);
    const checkPass = await argon.verify(user.Password, loginDto.password);
    if (!checkPass)
      throw new HttpException(
        'Password is not correct',
        HttpStatus.UNAUTHORIZED,
      );
    // checkRole
    let candidateID = null;
    if (user.UserRole_ID === 3) {
      const candidate = await this.prisma.candidate.findFirst({
        where: { User_ID: user.ID },
      });
      if (candidate) candidateID = candidate.ID;
    }

    const key = Date.now();

    const payload = {
      userID: user.ID,
      username: user.Username,
      candidateID,
      key,
    };
    const refresh_token = await this.jwtService.sign(payload, {
      expiresIn: '120s',
      privateKey: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
    });
    await this.usersService.updateUserToken(refresh_token, user.ID);

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '60s',
      privateKey: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });
    const data = {
      access_token,
      refreshToken: refresh_token,
      user: {
        userID: user.ID,
        userName: user.Username,
        Role: user.UserRole_ID,
        candidateID,
      },
    };
    return ResponseData(201, 'login success', data);
  }
  async refreshAccessToken(username: string, key: number): Promise<any> {
     if (!username || !key)
      throw new HttpException('Token không hợp lệ', HttpStatus.BAD_REQUEST);

    const user = await this.prisma.user.findFirst({
      where: { Username: username },
    });

    if (!user)
      throw new HttpException('Người dùng không tồn tại', HttpStatus.BAD_REQUEST);

    const refreshToken = user.refresh_token;
    try {
      await this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpException('Refresh token đã hết hạn', HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException('Refresh token không hợp lệ', HttpStatus.BAD_REQUEST);
      }
    }

    const decodeRefreshToken = this.jwtService.decode(refreshToken) as any; 
    if (!decodeRefreshToken || decodeRefreshToken.key !== key) {
      throw new HttpException('Key không đúng', HttpStatus.BAD_REQUEST);
    }

    let candidateID = null;
    if (user.UserRole_ID === 3) {
      const candidate = await this.prisma.candidate.findFirst({
        where: { User_ID: user.ID },
      });
      if (candidate) candidateID = candidate.ID;
    }

    const payload = {
      userID: user.ID,
      username: user.Username,
      candidateID,
      key,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '60s',
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });

    const data = {
      access_token,
      user: {
        userID: user.ID,
        userName: user.Username,
        Role: user.UserRole_ID,
        candidateID,
      },
    };

    return { statusCode: 201, message: 'Refresh token thành công', data };
  }

  async signUp(registerDto: CreateAuthDto) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { ID: 3 },
      });

      if (!role) {
        throw new HttpException(
          'Normal user role not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const userExist = await this.prisma.user.findMany({
        where: {
          Username: registerDto.username,
        },
      });

      if (userExist && userExist.length > 0) {
        throw new BadRequestException(
          `Field username: ${registerDto.username} already exists in the user table`,
        );
      }

      const emailExistInCandidate = await this.prisma.candidate.findMany({
        where: {
          Email: registerDto.email,
        },
      });

      if (emailExistInCandidate && emailExistInCandidate.length > 0) {
        throw new BadRequestException(
          `Field email: ${registerDto.email} already exists in the candidate table`,
        );
      }
      const passwordHash = await argon.hash(registerDto.password);
      const newUser = await this.prisma.user.create({
        data: {
          Username: registerDto.username,
          Password: passwordHash,
          UserRole_ID: role.ID,
          RegisterDate: new Date(),
          // refresh_token,
        },
        select: {
          RegisterDate: true,
          Username: true,
          ID: true,
        },
      });
      const newCandidate = await this.prisma.candidate.create({
        data: {
          Full_Name: registerDto.fullname,
          Email: registerDto.email,
          User_ID: newUser.ID,
        },
        select: {
          Full_Name: true,
          Email: true,
        },
      });
      const responseData = {
        message: 'signUp Success',
        user: {
          ID: newUser.ID,
          Username: newUser.Username,
          RegisterDate: newUser.RegisterDate,
        },
        candidate: {
          Full_Name: newCandidate.Full_Name,
          Email: newCandidate.Email,
        },
      };
      return ResponseData(201, 'signUp Success', responseData);
    } catch (error) {
      return ResponseData(500, 'Internal Server Error', error);
      throw error;
    }
  }


}
