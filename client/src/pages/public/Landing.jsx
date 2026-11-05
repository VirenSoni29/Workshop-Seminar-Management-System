import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useForm from "../../hooks/useForm";
import StatusBadge from "../../components/common/StatusBadge";
import { verifySchema } from "../../utils/validationSchemas";
import { HOME_BY_ROLE } from "../../utils/constants";

const STEPS = [
   {
      title: "Browse",
      text: "Search by title, department, type or mode, and see how many seats are left before you commit.",
   },
   {
      title: "Register",
      text: "Take a seat, or join the waitlist if the session is full. You move up automatically when someone cancels.",
   },
   {
      title: "Check in",
      text: "Show your QR pass at the door. Faculty scan it and your attendance is recorded straight away.",
   },
   {
      title: "Get certified",
      text: "When the session is marked complete, download your certificate as a PDF. Anyone can verify it online.",
   },
];

const ROLES = [
   {
      role: "student",
      label: "Students",
      title: "Find it, join it, prove you were there",
      text: "Register or cancel in a tap, track your waitlist spot, keep QR passes on your phone and collect certificates in one place.",
   },
   {
      role: "faculty",
      label: "Faculty",
      title: "Run a session from draft to certificate",
      text: "Draft a workshop, submit it for approval, then manage attendees, scan QR passes, mark it complete and issue certificates.",
   },
   {
      role: "admin",
      label: "Admins",
      title: "Keep the whole calendar under control",
      text: "Approve or reject submissions with remarks, manage accounts, and watch registrations, attendance and certificates on one dashboard.",
   },
];

export default function Landing() {
   const { user } = useAuth();
   const navigate = useNavigate();

   const verifyForm = useForm({
      initialValues: { certificateId: "" },
      validationSchema: verifySchema,
      onSubmit: (values) => {
         navigate(
            `/verify/${encodeURIComponent(values.certificateId.trim().toUpperCase())}`,
         );
      },
   });

   const verifyError = verifyForm.touched.certificateId
      ? verifyForm.errors.certificateId
      : undefined;

   return (
      <>
         {/* ============ Hero ============ */}
         <section className="hero wrap">
            <div className="hero__copy">
               <h1 className="hero__title">
                  Every workshop on campus, from sign-up to certificate
               </h1>
               <p className="hero__lead">
                  Browse upcoming workshops and seminars, reserve a seat, check
                  in with a QR pass, and download your certificate when the
                  session ends.
               </p>
               <div className="cluster hero__actions">
                  {user ? (
                     <Link
                        className="btn btn-primary btn-lg"
                        to={HOME_BY_ROLE[user.role]}
                     >
                        Go to dashboard
                     </Link>
                  ) : (
                     <>
                        <Link className="btn btn-primary btn-lg" to="/signup">
                           Create account
                        </Link>
                        <Link className="btn btn-secondary btn-lg" to="/login">
                           Log in
                        </Link>
                     </>
                  )}
               </div>
               <p className="hero__note">
                  Faculty publish sessions for approval. Admins keep the
                  calendar in order.
               </p>
            </div>

            <div className="hero__visual">
               <article
                  className="ticket"
                  aria-label="Example registration ticket"
               >
                  <div className="ticket__main">
                     <div className="ticket__tags">
                        <span className="badge badge--accent">Workshop</span>
                        <StatusBadge status="registered" dot />
                     </div>
                     <h2 className="ticket__title">
                        Intro to Machine Learning with Python
                     </h2>
                     <dl className="ticket__facts">
                        <div>
                           <dt>Date</dt>
                           <dd>Sat, 14 Nov 2026, 10:00 am</dd>
                        </div>
                        <div>
                           <dt>Venue</dt>
                           <dd>Seminar Hall B</dd>
                        </div>
                        <div className="span-2">
                           <dt>Speaker</dt>
                           <dd>Dr. Meera Sharma, Computer Science</dd>
                        </div>
                     </dl>
                     <div className="seats">
                        <span>42 of 60 seats taken</span>
                        <div className="progress" style={{ "--value": "70%" }}>
                           <div className="progress__bar" />
                        </div>
                     </div>
                  </div>

                  <div className="ticket__tear" aria-hidden="true" />

                  <div className="ticket__stub">
                     <div className="qr-frame">
                        {/* Decorative stand-in; the real ticket shows the API's qrImage */}
                        <svg
                           viewBox="0 0 21 21"
                           role="img"
                           aria-label="Example QR code"
                           shapeRendering="crispEdges"
                        >
                           <g fill="#141a2b">
                              <path
                                 fillRule="evenodd"
                                 d="M0 0h7v7H0zM1 1v5h5V1zM14 0h7v7h-7zM15 1v5h5V1zM0 14h7v7H0zM1 15v5h5v-5z"
                              />
                              <path d="M2 2h3v3H2zM16 2h3v3h-3zM2 16h3v3H2z" />
                              <path d="M8 0h1v1H8zM10 0h2v1h-2zM9 2h1v2H9zM11 1h1v1h-1zM8 4h2v1H8zM12 3h1v2h-1zM10 5h1v2h-1zM8 7h1v1H8zM12 6h1v1h-1zM0 8h2v1H0zM3 8h1v2H3zM5 8h2v1H5zM9 8h2v1H9zM12 8h2v1h-2zM15 8h1v1h-1zM18 8h3v1h-3zM1 10h1v1H1zM4 10h2v1H4zM8 10h1v2H8zM10 9h1v2h-1zM13 10h2v1h-2zM16 10h1v2h-1zM19 10h2v1h-2zM0 12h3v1H0zM4 12h1v1H4zM6 11h1v2H6zM11 12h2v1h-2zM14 12h1v1h-1zM18 12h1v2h-1zM8 14h2v1H8zM11 14h1v2h-1zM14 14h3v1h-3zM19 14h2v1h-2zM8 16h1v2H8zM10 17h2v1h-2zM13 16h1v2h-1zM15 16h2v1h-2zM18 16h1v1h-1zM20 16h1v2h-1zM9 19h1v2H9zM11 19h2v1h-2zM14 18h1v3h-1zM16 19h2v1h-2zM19 19h2v2h-2z" />
                           </g>
                        </svg>
                     </div>
                     <p>Show this at the door</p>
                  </div>
               </article>
            </div>
         </section>

         {/* ============ How it works ============ */}
         <section className="landing-section" id="how-it-works">
            <div className="wrap">
               <h2 className="landing-heading">
                  What happens after you sign up
               </h2>
               <p className="landing-intro">
                  One flow from finding a session to holding a certificate you
                  can prove is real.
               </p>

               <ol className="steps">
                  {STEPS.map((s) => (
                     <li className="steps__item" key={s.title}>
                        <h3>{s.title}</h3>
                        <p>{s.text}</p>
                     </li>
                  ))}
               </ol>
            </div>
         </section>

         {/* ============ Roles ============ */}
         <section className="landing-section" id="roles">
            <div className="wrap roles-layout">
               <div>
                  <h2 className="landing-heading">Built around three roles</h2>
                  <p className="landing-intro">
                     Each person sees only what they need, and the server
                     enforces it, not just the menu.
                  </p>
               </div>

               <ul className="roles">
                  {ROLES.map((r) => (
                     <li className="roles__item" key={r.role}>
                        <StatusBadge status={r.role} label={r.label} />
                        <div>
                           <h3>{r.title}</h3>
                           <p>{r.text}</p>
                        </div>
                     </li>
                  ))}
               </ul>
            </div>
         </section>

         {/* ============ Verify certificate ============ */}
         <section
            className="landing-section"
            id="verify"
            style={{ paddingTop: 0 }}
         >
            <div className="wrap">
               <div className="verify-band">
                  <div>
                     <h2>Check that a certificate is genuine</h2>
                     <p>
                        Every certificate carries an ID like{" "}
                        <span className="mono">CERT-A1B2C3D4E5</span> and a QR
                        code. Enter the ID to see who it was issued to and for
                        which workshop.
                     </p>
                  </div>

                  <div>
                     <form
                        className="verify-form"
                        onSubmit={verifyForm.handleSubmit}
                        noValidate
                     >
                        <div className="input-wrap">
                           <BadgeCheck className="input-icon" />
                           <input
                              className={`input mono${verifyError ? " is-invalid" : ""}`}
                              placeholder="CERT-XXXXXXXXXX"
                              aria-label="Certificate ID"
                              aria-invalid={verifyError ? "true" : undefined}
                              {...verifyForm.getFieldProps("certificateId")}
                           />
                        </div>
                        <button className="btn btn-primary" type="submit">
                           Verify
                        </button>
                     </form>
                     {verifyError && (
                        <p className="field-error" role="alert">
                           {verifyError}
                        </p>
                     )}
                  </div>
               </div>
            </div>
         </section>
      </>
   );
}
