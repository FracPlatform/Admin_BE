import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';
import { SpecificationField } from 'src/datalayer/model';

export class EditSpecificationDto {
  @IsString()
  @ApiProperty({ type: String, description: 'id of specification field' })
  id: string;

  @IsObject()
  @ApiProperty({ type: SpecificationField })
  newSpecification: SpecificationField;
}
