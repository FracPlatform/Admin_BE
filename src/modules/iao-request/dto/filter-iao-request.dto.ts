import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
  IsEnum,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { IAO_REQUEST_STATUS, IAO_REQUEST_TYPE } from 'src/datalayer/model';
import moment = require('moment');

export function ValidateDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'ValidateDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return moment(value, 'DD-MM-YYYY', true).isValid();
        },
      },
    });
  };
}

export class FilterIAORequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  keyword: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  submittedBy: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateDate('submittedFrom', {
    message: 'submitted From  must be formatted as dd-mm-yyyy',
  })
  submittedFrom: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateDate('submittedTo', {
    message: 'submitted To  must be formatted as dd-mm-yyyy',
  })
  submittedTo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateDate('_1stReviewedFrom', {
    message: '1st reviewed From  must be formatted as dd-mm-yyyy',
  })
  _1stReviewedFrom: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateDate('_1stReviewedTo', {
    message: '1st reviewed To  must be formatted as dd-mm-yyyy',
  })
  _1stReviewedTo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  _1stReviewedBy: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateDate('_2stReviewedFrom', {
    message: '2st reviewed From  must be formatted as dd-mm-yyyy',
  })
  _2stReviewedFrom: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateDate('_2stReviewedTo', {
    message: '2st reviewed to  must be formatted as dd-mm-yyyy',
  })
  _2stReviewedTo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  _2stReviewedBy: string;

  @ApiProperty({ required: false, description: '1 => VAULT, 2 => NON_VAULT' })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(IAO_REQUEST_TYPE)
  type: number;

  @ApiProperty({
    required: false,
    description:
      '1 => DRAFT, 2 => IN_REVIEW, 3 => REJECTED, 4 => APPROVED_A, 5 => APPROVED_B, 6 => CLOSED',
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(IAO_REQUEST_STATUS)
  status: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'E0' })
  sortField: string;

  @ApiProperty({ required: false, description: '-1 => DESC, 1 => ASC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortType: number;
}

export class DetailIAORequestDto {
  @ApiProperty({ required: false, description: '1-true, 0-false' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isGetNft: number;
}