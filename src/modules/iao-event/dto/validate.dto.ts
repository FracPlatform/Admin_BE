import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Utils } from '../../../common/utils';

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
          return new Date(value) > new Date(relatedValue);
        },
      },
    });
  };
}

export function ValidateWhitelistGreaterRegistration(
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
          if (value === null || value === undefined) {
            return true;
          }
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return new Date(value) >= new Date(relatedValue);
        },
      },
    });
  };
}

export function ValidateNumberic(validationOptions?: any) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'ValidateNumberic',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const noExponents = Utils.convertNumberToNoExponents(value);
          if (typeof value !== 'number') {
            return false;
          }
          if (
            noExponents.split('.').length > 1 &&
            noExponents.split('.')[1].length >
              validationOptions.maxDecimalPlaces
          ) {
            return false;
          }
          return true;
        },
      },
    });
  };
}
