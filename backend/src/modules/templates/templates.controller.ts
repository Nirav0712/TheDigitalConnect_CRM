import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async getTemplates(
    @Query('type') type: 'whatsapp' | 'email',
    @Req() req: any,
  ) {
    const orgId = req.organizationId || req.user?.organizationId || 'default-org';
    const targetType = type === 'email' ? 'email' : 'whatsapp';
    return this.templatesService.getTemplates(orgId, targetType);
  }

  @Post()
  async saveTemplate(@Body() data: any, @Req() req: any) {
    const orgId = req.organizationId || req.user?.organizationId || 'default-org';
    return this.templatesService.saveTemplate(orgId, data);
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string, @Req() req: any) {
    const orgId = req.organizationId || req.user?.organizationId || 'default-org';
    return this.templatesService.deleteTemplate(orgId, id);
  }
}
