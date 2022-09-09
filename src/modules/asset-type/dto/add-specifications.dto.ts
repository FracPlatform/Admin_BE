import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { SpecificationField } from 'src/datalayer/model';

export class AddSpecificationDto {
  @IsArray()
  @ApiProperty({ type: [SpecificationField] })
  specifications: SpecificationField[];
}
