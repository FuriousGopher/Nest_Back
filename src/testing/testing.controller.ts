import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TestingService } from './testing.service';
import { CreateTestingDto } from './dto/create-testing.dto';
import { UpdateTestingDto } from './dto/update-testing.dto';

@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Post()
  create(@Body() createTestingDto: CreateTestingDto) {
    return this.testingService.create(createTestingDto);
  }

  @Get()
  findAll() {
    return this.testingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestingDto: UpdateTestingDto) {
    return this.testingService.update(+id, updateTestingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testingService.remove(+id);
  }
}
