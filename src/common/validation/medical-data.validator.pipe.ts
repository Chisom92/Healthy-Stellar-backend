import { Injectable, BadRequestException, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MedicalDataSanitizerService } from './medical-data-sanitizer.service';

@Injectable()
export class MedicalDataValidationPipe implements PipeTransform {
  constructor(private sanitizer: MedicalDataSanitizerService) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('Validation failed: No data provided');
    }

    const object = plainToInstance(metadata.type, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors
        .map(error => ({
          field: error.property,
          message: 'Medical data validation failed'
        }));
      
      throw new BadRequestException({
        statusCode: 400,
        message: 'Medical data validation failed',
        errors: messages
      });
    }

    return this.sanitizer.sanitizeObject(value);
  }
}
