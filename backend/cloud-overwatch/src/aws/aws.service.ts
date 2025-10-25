import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import axios from 'axios';

@Injectable()
export class AwsService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  // 🔹 Connect Account
  async connectAccount(dto: { roleArn: string; externalId: string; email: string }) {
    try {
      const response = await axios.post(
        'https://bvkn7xjpa2.execute-api.ap-south-1.amazonaws.com/connect-account',
        dto
      );

      const data = response.data;
      console.log('Lambda Response:', data);

      const accountId = data?.data?.accountId;
      if (!accountId) throw new BadRequestException('accountId not found in Lambda response');

      const user = await this.userRepo.findOne({ where: { email: dto.email } });
      if (!user) throw new BadRequestException('User not found');

      user.accountId = accountId;
      await this.userRepo.save(user);

      return {
        message: 'AWS account connected successfully',
        userId: user.userId,
        accountId: user.accountId,
      };
    } catch (error) {
      console.error('ConnectAccount error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to connect AWS account');
    }
  }

  // 🔹 Scan Resources
  async scanResources(dto: any) {
    try {
      const response = await axios.post(
        'https://71bv1olwe4.execute-api.ap-south-1.amazonaws.com/scan-account',
        dto,
        { timeout: 60000 }
      );
      console.log('Scan Lambda Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Scan Lambda Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to scan AWS resources');
    }
  }

  // 🔹 Get Resources (your new Lambda)
  async getResources(dto: any) {
    try {
      const response = await axios.post(
        'https://ohqyrz81a9.execute-api.ap-south-1.amazonaws.com/get-resources',
        dto,
        { timeout: 60000 }
      );
      console.log('GetResources Lambda Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('GetResources Lambda Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to fetch AWS resources');
    }
  }

  // 🔹 Delete Expired Resources
  async deleteResources(dto: any) {
    try {
      const response = await axios.post(
        'https://nbwzfidofi.execute-api.ap-south-1.amazonaws.com/delete-resources',
        {}
      );
      console.log('DeleteResources Lambda Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DeleteResources Lambda Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to delete AWS resources');
    }
  }
}
