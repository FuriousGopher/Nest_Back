import { PartialType } from '@nestjs/mapped-types';
import { CreateTestingDto } from './create-testing.dto';

export class UpdateTestingDto extends PartialType(CreateTestingDto) {}
