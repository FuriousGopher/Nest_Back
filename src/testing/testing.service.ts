import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class TestingService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
}
