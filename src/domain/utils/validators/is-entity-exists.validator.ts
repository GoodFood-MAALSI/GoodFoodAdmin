import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsEntityExistsConstraint implements ValidatorConstraintInterface {
  constructor(private dataSource: DataSource) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [entityClass, property = 'id'] = args.constraints;
    if (!value) return false;

    const repository = this.dataSource.getRepository(entityClass);
    const record = await repository.findOne({ where: { [property]: value } });

    return !!record;
  }

  defaultMessage(args: ValidationArguments): string {
    const [entityClass] = args.constraints;
    return `${entityClass.name} with the given ID does not exist`;
  }
}

export function IsEntityExists(
  entityClass: Function,
  validationOptions?: ValidationOptions,
  property = 'id',
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entityClass, property],
      validator: IsEntityExistsConstraint,
    });
  };
}
