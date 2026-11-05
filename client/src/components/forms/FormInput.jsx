import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import FormField from "./FormField";

// <FormInput label="Email" icon={Mail} required {...form.getFieldProps('email')} />
// type="password" automatically gets the show/hide button.
export default function FormInput({
   id,
   name,
   label,
   type = "text",
   icon: Icon,
   required,
   hint,
   error,
   className, // goes on the .field wrapper (e.g. "span-2")
   ...rest // value, onChange, onBlur, placeholder, autoComplete, disabled, ...
}) {
   const [show, setShow] = useState(false);
   const inputId = id ?? name;
   const isPassword = type === "password";

   const input = (
      <input
         className={clsx("input", error && "is-invalid")}
         id={inputId}
         name={name}
         type={isPassword && show ? "text" : type}
         aria-invalid={error ? "true" : undefined}
         aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
         }
         {...rest}
      />
   );

   return (
      <FormField
         id={inputId}
         label={label}
         required={required}
         hint={hint}
         error={error}
         className={className}
      >
         {Icon || isPassword ? (
            <div className="input-wrap">
               {Icon && <Icon className="input-icon" />}
               {input}
               {isPassword && (
                  <button
                     type="button"
                     className="btn btn-ghost btn-icon btn-sm input-action pw-toggle"
                     onClick={() => setShow((s) => !s)}
                     aria-label={show ? "Hide password" : "Show password"}
                     aria-pressed={show}
                  >
                     {show ? <EyeOff /> : <Eye />}
                  </button>
               )}
            </div>
         ) : (
            input
         )}
      </FormField>
   );
}
