export class IntrospectionValidationEntity {
  scopes?: string[] | ComplexValidationEntity[];
  groups?: IntrospectionGroupValidationEntity[];
  required?: boolean;
  permissions?: string[] | ComplexValidationEntity[];
}
export class IntrospectionGroupValidationEntity {
  group_id: string;
  roles: string[] | RoleComplexValidationEntity[];
  required?: boolean;
}
export class ComplexValidationEntity {
  [key: string]: any;
  required?: boolean;
}
export class RoleComplexValidationEntity extends ComplexValidationEntity {
  role_key: string;
  permissions: string[] | ComplexValidationEntity[];
  required?: boolean;
}
