import clsx from "clsx";

// Shared wrapper: label + control + hint/error.
// Pass className="span-2" for full width inside .form-grid.
export default function FormField({
   id,
   label,
   required,
   hint,
   error,
   className,
   children,
}) {
   return (
      <div className={clsx("field", className)}>
         {label && (
            <label
               className={clsx("field-label", required && "is-required")}
               htmlFor={id}
            >
               {label}
            </label>
         )}
         {children}
         {error ? (
            <p className="field-error" id={`${id}-error`} role="alert">
               {error}
            </p>
         ) : (
            hint && (
               <p className="field-hint" id={`${id}-hint`}>
                  {hint}
               </p>
            )
         )}
      </div>
   );
}
