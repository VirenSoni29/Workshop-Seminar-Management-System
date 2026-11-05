import clsx from "clsx";
import FormField from "./FormField";

// <FormTextarea label="Description" rows={5} {...form.getFieldProps('description')} />
export default function FormTextarea({
   id,
   name,
   label,
   rows = 4,
   required,
   hint,
   error,
   className,
   ...rest
}) {
   const areaId = id ?? name;

   return (
      <FormField
         id={areaId}
         label={label}
         required={required}
         hint={hint}
         error={error}
         className={className}
      >
         <textarea
            className={clsx("input", error && "is-invalid")}
            id={areaId}
            name={name}
            rows={rows}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
               error ? `${areaId}-error` : hint ? `${areaId}-hint` : undefined
            }
            {...rest}
         />
      </FormField>
   );
}
