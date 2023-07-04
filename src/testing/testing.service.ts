import { Injectable } from '@nestjs/common';
import { CreateTestingDto } from './dto/create-testing.dto';
import { UpdateTestingDto } from './dto/update-testing.dto';

@Injectable()
export class TestingService {
  create(createTestingDto: CreateTestingDto) {
    return 'This action adds a new testing';
  }

  findAll() {
    return `This action returns all testing`;
  }

  findOne(id: number) {
    return `This action returns a #${id} testing`;
  }

  update(id: number, updateTestingDto: UpdateTestingDto) {
    return `This action updates a #${id} testing`;
  }

  remove(id: number) {
    return `This action removes a #${id} testing`;
  }
}
