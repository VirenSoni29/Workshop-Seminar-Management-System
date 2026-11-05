import clsx from "clsx";
import FormField from "./FormField";

// <FormSelect label="I am a" options={[{ value: 'student', label: 'Student' }]} {...form.getFieldProps('role')} />
// Add placeholder="Select..." to get an empty first option.
export default function FormSelect({
   id,
   name,
   label,
   options = [],
   placeholder,
   required,
   hint,
   error,
   className, // goes on the .field wrapper
   ...rest // value, onChange, onBlur, disabled
}) {
   const selectId = id ?? name;

   return (
      <FormField
         id={selectId}
         label={label}
         required={required}
         hint={hint}
         error={error}
         className={className}
      >
         <select
            className={clsx("input", error && "is-invalid")}
            id={selectId}
            name={name}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
               error
                  ? `${selectId}-error`
                  : hint
                     ? `${selectId}-hint`
                     : undefined
            }
            {...rest}
         >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
               <option key={o.value} value={o.value}>
                  {o.label}
               </option>
            ))}
         </select>
      </FormField>
   );
}
