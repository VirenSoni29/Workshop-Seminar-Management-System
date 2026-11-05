import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CircleAlert, Lock, Mail } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useForm from "../../hooks/useForm";
import FormInput from "../../components/forms/FormInput";
import ThemeToggle from "../../components/common/ThemeToggle";
import StatusBadge from "../../components/common/StatusBadge";
import { Spinner } from "../../components/common/Loader";
import { loginSchema } from "../../utils/validationSchemas";
import { getErrorMessage, getFieldErrors } from "../../utils/getErrorMessage";

const DEMO_ACCOUNTS = [
   {
      role: "admin",
      title: "Approvals, users, stats",
      email: "admin@college.edu",
      password: "Admin@123",
   },
   {
      role: "faculty",
      title: "Workshops, scanner, certificates",
      email: "faculty1@college.edu",
      password: "Faculty@123",
   },
   {
      role: "student",
      title: "Browse, register, QR pass",
      email: "student1@college.edu",
      password: "Student@123",
   },
];

export default function Login() {
   const { login } = useAuth();
   const [formError, setFormError] = useState("");

   const form = useForm({
      initialValues: { email: "", password: "" },
      validationSchema: loginSchema,
      onSubmit: async (values, { setServerErrors }) => {
         setFormError("");
         try {
            // On success AuthContext sets the user and GuestRoute redirects (see note below).
            await login({
               email: values.email.trim(),
               password: values.password,
            });
         } catch (err) {
            setServerErrors(getFieldErrors(err));
            setFormError(getErrorMessage(err));
         }
      },
   });

   const fillDemo = (acc) => {
      setFormError("");
      form.reset({ email: acc.email, password: acc.password });
   };

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

            <div className="auth__center">
               <div className="auth__head">
                  <h1>Welcome back</h1>
                  <p>Log in to register for workshops or manage your own.</p>
               </div>

               <form
                  className="auth__form"
                  onSubmit={form.handleSubmit}
                  noValidate
               >
                  {formError && (
                     <div className="alert alert--danger" role="alert">
                        <CircleAlert />
                        <div>
                           <p className="alert__title">Could not log you in</p>
                           <p>{formError}</p>
                        </div>
                     </div>
                  )}

                  <FormInput
                     label="Email"
                     type="email"
                     icon={Mail}
                     required
                     autoComplete="email"
                     placeholder="you@college.edu"
                     {...form.getFieldProps("email")}
                  />
                  <FormInput
                     label="Password"
                     type="password"
                     icon={Lock}
                     required
                     autoComplete="current-password"
                     placeholder="Your password"
                     {...form.getFieldProps("password")}
                  />

                  <button
                     className={`btn btn-primary btn-lg btn-block${form.isSubmitting ? " is-loading" : ""}`}
                     type="submit"
                     disabled={form.isSubmitting}
                  >
                     {form.isSubmitting && <Spinner />}
                     Log in
                  </button>
               </form>

               <p className="auth__switch">
                  New here? <Link to="/signup">Create an account</Link>
               </p>
            </div>
         </main>

         <aside className="auth__aside" aria-labelledby="demo-title">
            <h2 id="demo-title">Try a demo account</h2>
            <p>
               Seeded for the lab demo. Pick one to fill the form, then log in.
            </p>

            <ul className="aside-list">
               {DEMO_ACCOUNTS.map((acc) => (
                  <li className="aside-item" key={acc.role}>
                     <StatusBadge status={acc.role} />
                     <div className="aside-item__text">
                        <strong>{acc.title}</strong>
                        <span>{acc.email}</span>
                     </div>
                     <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={() => fillDemo(acc)}
                     >
                        Use
                     </button>
                  </li>
               ))}
            </ul>
         </aside>
      </div>
   );
}
