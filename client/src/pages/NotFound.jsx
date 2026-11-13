import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { HOME_BY_ROLE } from "../utils/constants";

export default function NotFound() {
   const navigate = useNavigate();
   const { user, isAuthenticated } = useAuth();
   const home = isAuthenticated ? HOME_BY_ROLE[user?.role] || "/" : "/";

   return (
      <main className="tw:flex tw:min-h-screen tw:items-center tw:justify-center tw:p-(--sp-6)">
         <section className="card tw:w-full tw:max-w-120 tw:text-center">
            <div className="card-body tw:flex tw:flex-col tw:items-center tw:gap-(--sp-3)">
               <span className="icon-box">
                  <Compass size={20} />
               </span>
               <span className="eyebrow">ERROR 404</span>
               <h1>Page not found</h1>
               <p className="text-secondary">
                  The page you're looking for doesn't exist or may have been
                  moved.
               </p>
               <div className="tw:mt-(--sp-3) tw:flex tw:flex-wrap tw:justify-center tw:gap-(--sp-3)">
                  <button
                     type="button"
                     className="btn btn-secondary"
                     onClick={() => navigate(-1)}
                  >
                     <ArrowLeft size={16} />
                     Go back
                  </button>
                  <Link className="btn btn-primary" to={home}>
                     {isAuthenticated ? "Back to dashboard" : "Back to home"}
                  </Link>
               </div>
            </div>
         </section>
      </main>
   );
}
