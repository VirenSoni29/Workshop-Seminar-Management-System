import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Loader from "../components/common/Loader";
import { HOME_BY_ROLE } from "../utils/constants";

// For /login and /signup: logged-in users are sent to their dashboard.
export default function GuestRoute() {
   const { user, ready } = useAuth();

   if (!ready) return <Loader page />;
   if (user) return <Navigate to={location.state?.from?.pathname || HOME_BY_ROLE[user.role]} replace />;
   return <Outlet />;
}
