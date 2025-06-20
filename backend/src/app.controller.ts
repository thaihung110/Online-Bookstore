import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get API Information',
    description:
      'Returns application information including currency configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Application information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        currency: {
          type: 'object',
          properties: {
            base: { type: 'string' },
            exchangeRate: {
              type: 'object',
              properties: {
                vnd: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  getAppInfo() {
    return this.appService.getAppInfo();
  }
}
