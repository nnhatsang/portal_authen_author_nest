import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
    private jwtService: JwtService,
    private configService: ConfigService
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
    const decodeRefreshToken = this.jwtService.decode(user.refresh_token);
    console.log(decodeRefreshToken)
    const key = decodeRefreshToken.key;

    const payload = {
      userID: user.ID,
      username: user.Username,
      candidateID,
      key
    };
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.sign(payload,
      {
        expiresIn: '30d',
        privateKey: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      },);
        await this.usersService.updateUserToken(refresh_token, user.ID);

    const data = {
      access_token,
      refreshToken:refresh_token,
      user: {
        userID: user.ID,
        userName: user.Username,
        Role: user.UserRole_ID,
        candidateID,
      },
    };
    return ResponseData(201, 'login success', data);
  }
  async refreshToken(username: string, key: number): Promise<any> {
    // console.log(username);
    // console.log(key)
    if (!username || !key)
      throw new HttpException('token khong hơp le', HttpStatus.BAD_REQUEST);
    const user = await this.prisma.user.findFirst({
      where: { Username: username },
    });
    if (!user)
      throw new HttpException('user is not exits', HttpStatus.BAD_REQUEST);

    const refreshToken = user.refresh_token;
    const decodeRefreshToken = this.jwtService.decode(refreshToken);
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
      key
    };
    
    const access_token = this.jwtService.sign(payload);
    // console.log(access_token)
    const data = {
      access_token,
      user: {
        userID: user.ID,
        userName: user.Username,
        Role: user.UserRole_ID,
        candidateID,
      },
    };
    return ResponseData(201, 'refresh success', data);
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
     const key = Date.now();
     const refresh_token = await this.jwtService.signAsync(
      {
        data:{
          username:registerDto.username,
          key,
          
        }
      },  {
        expiresIn: '30d',
        privateKey: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      },
    );      

      const newUser = await this.prisma.user.create({
        data: {
          Username: registerDto.username,
          Password: passwordHash,
          UserRole_ID: role.ID,
          RegisterDate: new Date(),
          refresh_token,
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
