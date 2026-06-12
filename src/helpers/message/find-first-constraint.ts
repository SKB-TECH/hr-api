import { ValidationError } from 'class-validator';
import { FirstConstraint } from './first-constraint.interface';

export function findFirstConstraint(
  errors: ValidationError[],
): FirstConstraint | null {
  for (const error of errors) {
    if (error.constraints) {
      const key = Object.keys(error.constraints)[0];
      return { key, property: error.property, fallback: 'validation.invalid' };
    }
    if (error.children && error.children.length) {
      const child = findFirstConstraint(error.children);
      if (child) return child;
    }
  }
  return null;
}
