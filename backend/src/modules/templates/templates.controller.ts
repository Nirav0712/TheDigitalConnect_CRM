import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('api/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async getTemplates(
    @Query('type') type: 'whatsapp' | 'email',
    @CurrentTenant() orgId: string,
  ) {
    const targetType = type === 'email' ? 'email' : 'whatsapp';
    return this.templatesService.getTemplates(orgId, targetType);
  }

  @Post()
  async saveTemplate(@Body() data: any, @CurrentTenant() orgId: string) {
    return this.templatesService.saveTemplate(orgId, data);
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string, @CurrentTenant() orgId: string) {
    return this.templatesService.deleteTemplate(orgId, id);
  }
}
