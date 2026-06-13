import * as Yup from "yup";
import type { Field } from "./schemas";

// Build a Yup schema dynamically from a CrudPage field config.
export function buildYupSchema(fields: Field[]) {
  const shape: Record<string, Yup.AnySchema> = {};
  for (const f of fields) {
    let s: Yup.AnySchema;
    if (f.type === "number") {
      s = Yup.number().typeError(`${f.label} must be a number`).min(0, `${f.label} can't be negative`);
      if (f.required) s = (s as Yup.NumberSchema).required(`${f.label} is required`);
    } else if (f.type === "email") {
      s = Yup.string().email("Enter a valid email address");
      if (f.required) s = (s as Yup.StringSchema).required(`${f.label} is required`);
    } else {
      s = Yup.string();
      if (f.required) s = (s as Yup.StringSchema).required(`${f.label} is required`);
    }
    shape[f.name] = s;
  }
  return Yup.object().shape(shape);
}
