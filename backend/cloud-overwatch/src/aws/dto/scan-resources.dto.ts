import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ScanResourcesDto {
  @ApiProperty({
    example: 'akkaushiik@gmail.com',
    description: 'Email of the user to identify their AWS account',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '188092337561',
    description: 'AWS account ID associated with the user',
  })
  @IsString()
  @IsOptional()
  accountId?: string;
}
