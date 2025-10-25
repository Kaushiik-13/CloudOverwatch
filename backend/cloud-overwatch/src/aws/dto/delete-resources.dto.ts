import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeleteResourcesDto {
  @ApiProperty({
    example: '188092337561',
    description: 'Optional AWS Account ID. If not provided, cleanup runs for all connected accounts.',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountId?: string;
}
