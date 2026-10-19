import type { FormInstance } from 'antd'

import type { FieldErrors } from '../api/errors'

/**
 * Show server-side validation errors on matching Ant Design form fields.
 * Returns true if at least one field error was applied.
 */
export function applyFieldErrors<T>(form: FormInstance<T>, fieldErrors: FieldErrors): boolean {
  const known = new Set(Object.keys(form.getFieldsValue(true) as object))
  const fields = Object.entries(fieldErrors)
    .filter(([name]) => known.has(name))
    .map(([name, errors]) => ({ name: name as never, errors }))
  form.setFields(fields)
  return fields.length > 0
}
