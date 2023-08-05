import { Controller, Delete, HttpCode } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller('testing/all-data')
export class TestingController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @HttpCode(204)
  @Delete()
  remove() {
    return this.dataSource.query(
      `TRUNCATE users, blogs, comments, posts, devices CASCADE;`,
    );
  }
}
