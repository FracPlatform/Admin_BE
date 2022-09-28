import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import moment from 'moment';

export function ValidateDate(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'ValidateDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            moment(value, 'DD-MM-YYYY HH:MM:SS', true).isValid() &&
            moment(value, 'DD-MM-YYYY HH:MM:SS').toDate() > new Date()
          );
        },
      },
    });
  };
}

export function ValidateGreaterComparse(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'ValidatePhone',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return (
            moment(value, 'DD-MM-YYYY HH:MM:SS').toDate() >
            moment(relatedValue, 'DD-MM-YYYY HH:MM:SS').toDate()
          );
        },
      },
    });
  };
}
