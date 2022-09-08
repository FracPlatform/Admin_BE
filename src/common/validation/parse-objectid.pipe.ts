import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<any, Types.ObjectId> {
    transform(value: any, data): Types.ObjectId {
        const validObjectId = Types.ObjectId.isValid(value);

        if (!validObjectId) {
            throw new BadRequestException({
                code: -1,
                msg: 'Invalid object id.',
                errorCode: 'E0',
                extraInfo: {
                    field: data.data
                }
            });
        }

        return value;
    }
}