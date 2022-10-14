import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShipmentInfoDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  shipment_status: string;

  @ApiProperty({ required: false })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  shipment_time: any;
}

export class UpdateShipmentInfoDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(256)
    shipment_status: string;
  
    @ApiProperty({ required: false })
    // @Type(() => Date)
    @IsOptional()
    // @IsDate()
    shipment_time: any;
  }
