import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value !== 'object') {
      return value;
    }

    Object.keys(value).forEach(
      (k) =>
        (value[k] = typeof value[k] == 'string' ? value[k].trim() : value[k]),
    );
    return value;
  }
}
