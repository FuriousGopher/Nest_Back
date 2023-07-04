import { Controller, Delete, HttpCode } from '@nestjs/common';
import { TestingService } from './testing.service';

@Controller('testing/all-data')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @HttpCode(204)
  @Delete()
  remove() {
    return this.testingService.remove();
  }
}
