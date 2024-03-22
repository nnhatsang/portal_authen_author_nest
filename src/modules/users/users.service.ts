import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ResponseData } from 'src/utils/response.utils';

@Injectable()
export class UsersService {
  prisma = new PrismaClient();

  async findUser(username: string) {
    // try {
      const user = await this.prisma.user.findUnique({
        where: { Username:username },
        include: { role: true },
      });
      if (!user) return ResponseData(404, 'User is not exits', '');
      let candidateID = null;

      if (user.UserRole_ID === 3) {
        // Nếu user.Role là 3, thực hiện truy vấn để lấy candidateID
        const candidate = await this.prisma.candidate.findFirst({
          where: { User_ID: user.ID },
        });

        if (candidate) {
          candidateID = await this.prisma.candidate.findUnique({
            where: { ID: candidate.ID },
          });
        }
      }
      delete user.Password;
      delete user.refresh_token;
      const infoCandidate = {
        ...candidateID,
        ...user,
      };
      return ResponseData(201, 'Info User', infoCandidate);
    // } catch {
    //   return ResponseData(500, 'Info User','');
    // }
  }

 updateUserToken = async (refreshToken: string, id) => {
    try {
      

      const updatedUser = await this.prisma.user.update({
        where: { ID: id }, // Parse the ID to an integer if necessary
        data: { refresh_token: refreshToken },
      });

      if (!updatedUser) {
        throw new NotFoundException('User not found'); // Handle the case where the user is not found
      }

      return updatedUser;
    } catch (error) {
      // Handle or log the error appropriately
      console.error(error);
      throw error; // Re-throw the error for further handling, if needed
    }
  };
}
