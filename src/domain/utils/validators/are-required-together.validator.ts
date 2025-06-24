import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'AreFieldsRequiredTogether', async: false })
export class AreFieldsRequiredTogetherConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const object = args.object as any;
    const [fields] = args.constraints;

    const definedFields = fields.filter((field: string) => object[field] !== undefined && object[field] !== null);
    return definedFields.length === 0 || definedFields.length === fields.length;
  }

  defaultMessage(args: ValidationArguments) {
    const [fields] = args.constraints;
    return `Les champs ${fields.join(', ')} doivent tous être définis ensemble ou aucun ne doit l'être.`;
  }
}

export function AreFieldsRequiredTogether(fields: string[], validationOptions?: ValidationOptions) {
  return function (object: Function) {
    registerDecorator({
      name: 'AreFieldsRequiredTogether',
      target: object,
      propertyName: undefined, // Important: validation au niveau de la classe
      options: validationOptions,
      constraints: [fields],
      validator: AreFieldsRequiredTogetherConstraint,
    });
  };
}
