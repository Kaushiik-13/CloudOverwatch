import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) { }

  //  Sign Up (No Password Hashing)
  async signup(name: string, email: string, password: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const user = this.userRepo.create({
      userId: uuidv4(),
      name,
      email,
      password, // store as plain text
    });

    await this.userRepo.save(user);
    return { message: 'Signup successful', userId: user.userId };
  }

  //  Login (Plain text comparison)
  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Invalid credentials');

    if (user.password !== password)
      throw new BadRequestException('Invalid credentials');

    return {
      message: 'Login successful',
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        accountId: user.accountId,
      },
    };
  }

  async getDetails(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    return {
      message: 'User details fetched successfully',
      user,
    };
  }ack

}
