import { Link, Outlet } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import ThemeToggle from "../common/ThemeToggle";
import { HOME_BY_ROLE } from "../../utils/constants";

export default function PublicLayout() {
   const { user } = useAuth();

   return (
      <>
         <header className="navbar">
            <div className="navbar__inner navbar__inner--contained">
               <Link className="brand" to="/">
                  <span className="brand__mark">
                     <CalendarCheck />
                  </span>
                  Workshop Hub
               </Link>

               <nav className="navbar__links" aria-label="Main">
                  <a className="navbar__link" href="/#how-it-works">
                     How it works
                  </a>
                  <a className="navbar__link" href="/#roles">
                     Who it is for
                  </a>
                  <a className="navbar__link" href="/#verify">
                     Verify a certificate
                  </a>
               </nav>

               <div className="navbar__spacer" />

               <div className="navbar__actions">
                  <ThemeToggle />
                  {user ? (
                     <Link
                        className="btn btn-primary"
                        to={HOME_BY_ROLE[user.role]}
                     >
                        Go to dashboard
                     </Link>
                  ) : (
                     <>
                        <Link className="btn btn-ghost hide-xs" to="/login">
                           Log in
                        </Link>
                        <Link className="btn btn-primary" to="/signup">
                           Create account
                        </Link>
                     </>
                  )}
               </div>
            </div>
         </header>

         <main id="main">
            <Outlet />
         </main>

         <footer className="site-footer">
            <div className="wrap row-between">
               <span>Workshop Hub, a MERN mini-project</span>
               <span className="cluster">
                  {user ? (
                     <Link to={HOME_BY_ROLE[user.role]}>Dashboard</Link>
                  ) : (
                     <>
                        <Link to="/login">Log in</Link>
                        <Link to="/signup">Create account</Link>
                     </>
                  )}
               </span>
            </div>
         </footer>
      </>
   );
}
