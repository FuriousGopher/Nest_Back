import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SecurityService } from './security.service';
import { CreateSecurityDto } from './dto/create-security.dto';
import { UpdateSecurityDto } from './dto/update-security.dto';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post()
  create(@Body() createSecurityDto: CreateSecurityDto) {
    return this.securityService.create(createSecurityDto);
  }

  @Get()
  findAll() {
    return this.securityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.securityService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSecurityDto: UpdateSecurityDto,
  ) {
    return this.securityService.update(+id, updateSecurityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.securityService.remove(+id);
  }
}
