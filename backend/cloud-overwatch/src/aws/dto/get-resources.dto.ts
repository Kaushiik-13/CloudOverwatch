// src/aws/dto/get-resource.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class GetResourcesDto {
    @ApiProperty({
        example: '188092337561',
        description: 'AWS account ID associated with the user',
    })
    @IsOptional()
    @IsString()
    accountId?: string;
}
