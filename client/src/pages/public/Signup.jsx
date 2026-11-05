import { useState } from "react";
import { Link } from "react-router-dom";
import {
   Building2,
   CalendarCheck,
   CircleAlert,
   Hash,
   Lock,
   LockKeyhole,
   Mail,
   User,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useForm from "../../hooks/useForm";
import FormInput from "../../components/forms/FormInput";
import FormSelect from "../../components/forms/FormSelect";
import ThemeToggle from "../../components/common/ThemeToggle";
import StatusBadge from "../../components/common/StatusBadge";
import { Spinner } from "../../components/common/Loader";
import { signupSchema } from "../../utils/validationSchemas";
import { getErrorMessage, getFieldErrors } from "../../utils/getErrorMessage";
import { ID_LABEL_BY_ROLE } from "../../utils/constants";

const ROLE_OPTIONS = [
   { value: "student", label: "Student" },
   { value: "faculty", label: "Faculty member" },
];

export default function Signup() {
   const { register } = useAuth();
   const [formError, setFormError] = useState("");

   const form = useForm({
      initialValues: {
         name: "",
         email: "",
         role: "student",
         department: "",
         identifier: "",
         password: "",
         confirm: "",
      },
      validationSchema: signupSchema,
      onSubmit: async (values, { setServerErrors }) => {
         setFormError("");
         // `confirm` is frontend-only, so it is not sent. Empty identifier is omitted.
         const payload = {
            name: values.name.trim(),
            email: values.email.trim(),
            role: values.role,
            department: values.department.trim(),
            password: values.password,
         };
         if (values.identifier.trim())
            payload.identifier = values.identifier.trim();

         try {
            // On success AuthContext sets the user and GuestRoute redirects to the dashboard.
            await register(payload);
         } catch (err) {
            setServerErrors(getFieldErrors(err));
            setFormError(getErrorMessage(err));
         }
      },
   });

   const idLabel = ID_LABEL_BY_ROLE[form.values.role] || "Identifier";
   const idPlaceholder =
      form.values.role === "faculty" ? "e.g. EMP1042" : "e.g. 21CS1042";

   return (
      <div className="auth">
         <main className="auth__main" id="main">
            <div className="auth__top">
               <Link className="brand" to="/">
                  <span className="brand__mark">
                     <CalendarCheck />
                  </span>
                  Workshop Hub
               </Link>
               <ThemeToggle />
            </div>

            <div className="auth__center auth__center--wide">
               <div className="auth__head">
                  <h1>Create your account</h1>
                  <p>
                     Students and faculty can sign up here. It takes under a
                     minute.
                  </p>
               </div>

               <form onSubmit={form.handleSubmit} noValidate>
                  {formError && (
                     <div
                        className="alert alert--danger"
                        role="alert"
                        style={{ marginBottom: "var(--sp-5)" }}
                     >
                        <CircleAlert />
                        <div>
                           <p className="alert__title">
                              Could not create your account
                           </p>
                           <p>{formError}</p>
                        </div>
                     </div>
                  )}

                  <div className="form-grid">
                     <FormInput
                        className="span-2"
                        label="Full name"
                        icon={User}
                        required
                        autoComplete="name"
                        placeholder="Aarav Mehta"
                        {...form.getFieldProps("name")}
                     />
                     <FormInput
                        className="span-2"
                        label="Email"
                        type="email"
                        icon={Mail}
                        required
                        autoComplete="email"
                        placeholder="you@college.edu"
                        {...form.getFieldProps("email")}
                     />
                     <FormSelect
                        label="I am a"
                        required
                        options={ROLE_OPTIONS}
                        {...form.getFieldProps("role")}
                     />
                     <FormInput
                        label="Department"
                        icon={Building2}
                        required
                        placeholder="Computer Science"
                        {...form.getFieldProps("department")}
                     />
                     <FormInput
                        className="span-2"
                        label={idLabel}
                        icon={Hash}
                        placeholder={idPlaceholder}
                        hint="Optional. Shown to faculty on attendee lists."
                        {...form.getFieldProps("identifier")}
                     />
                     <FormInput
                        label="Password"
                        type="password"
                        icon={Lock}
                        required
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        {...form.getFieldProps("password")}
                     />
                     <FormInput
                        label="Confirm password"
                        type="password"
                        icon={LockKeyhole}
                        required
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        {...form.getFieldProps("confirm")}
                     />
                  </div>

                  <button
                     className={`btn btn-primary btn-lg btn-block${form.isSubmitting ? " is-loading" : ""}`}
                     type="submit"
                     disabled={form.isSubmitting}
                     style={{ marginTop: "var(--sp-6)" }}
                  >
                     {form.isSubmitting && <Spinner />}
                     Create account
                  </button>
               </form>

               <p className="auth__switch">
                  Already have an account? <Link to="/login">Log in</Link>
               </p>
            </div>
         </main>

         <aside className="auth__aside" aria-labelledby="who-title">
            <h2 id="who-title">What your account can do</h2>
            <p>
               Admin accounts are set up by the college, so they are not offered
               here.
            </p>

            <ul className="aside-list">
               <li className="aside-item aside-item--top">
                  <StatusBadge status="student" label="Student" />
                  <div className="aside-item__text">
                     <strong>Learn and collect proof</strong>
                     <span>
                        Browse and register for workshops, keep QR passes on
                        your phone and download certificates.
                     </span>
                  </div>
               </li>
               <li className="aside-item aside-item--top">
                  <StatusBadge status="faculty" label="Faculty" />
                  <div className="aside-item__text">
                     <strong>Run sessions and attend others</strong>
                     <span>
                        Create workshops for approval, scan QR passes and issue
                        certificates. You can also register for other faculty's
                        workshops.
                     </span>
                  </div>
               </li>
            </ul>
         </aside>
      </div>
   );
}
