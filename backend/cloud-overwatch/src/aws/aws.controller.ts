import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AwsService } from './aws.service';
import { ConnectAccountDto } from './dto/connect-account.dto';
import { ScanResourcesDto } from './dto/scan-resources.dto';
import { GetResourcesDto } from './dto/get-resources.dto';
import { DeleteResourcesDto } from './dto/delete-resources.dto';

@ApiTags('AWS')
@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Post('connect-account')
  @ApiOperation({ summary: 'Connect AWS Account' })
  async connectAccount(@Body() dto: ConnectAccountDto) {
    return this.awsService.connectAccount(dto);
  }

  @Post('scan-resources')
  @ApiOperation({ summary: 'Scan AWS Resources' })
  async scanResources(@Body() dto: ScanResourcesDto) {
    return this.awsService.scanResources(dto);
  }

  @Post('get-resources')
  @ApiOperation({ summary: 'Fetch AWS Resources from DynamoDB' })
  async getResources(@Body() dto: GetResourcesDto) {
    return this.awsService.getResources(dto);
  }

  @Post('delete-resources')
  @ApiOperation({ summary: 'Delete Expired AWS Resources' })
  async deleteResources(@Body() dto: DeleteResourcesDto) {
    return this.awsService.deleteResources(dto);
  }
}
