import { PartialType } from '@nestjs/swagger';
import { CreateIaoEventDto } from './create-iao-event.dto';

export class UpdateIaoEventDto extends PartialType(CreateIaoEventDto) {}
