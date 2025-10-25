import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { get } from 'axios';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Email already registered or invalid input' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.name, dto.email, dto.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

@Get('user')
  @ApiOperation({ summary: 'Get user details by email' })
  @ApiResponse({ status: 200, description: 'User details fetched successfully' })
  @ApiResponse({ status: 400, description: 'Invalid credentials or user not found' })
  async getUserDetails(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.authService.getDetails(email);
  }
}
