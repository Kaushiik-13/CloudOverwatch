import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ConnectAccountDto {
  @ApiProperty({
    example: 'arn:aws:iam::188092337561:role/CloudOverwatchAccessRole',
    description: 'The ARN of the AWS IAM role to connect',
  })
  @IsString()
  @IsNotEmpty()
  roleArn: string;

  @ApiProperty({
    example: 'external-id-demo-12345',
    description: 'External ID used during the role assumption for security',
  })
  @IsString()
  @IsNotEmpty()
  externalId: string;

  @ApiProperty({
    example: 'akkaushiik@gmail.com',
    description: 'User email associated with this AWS connection',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
