import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Loader from "../components/common/Loader";

// Must be logged in. Waits for the /me check, so there's no flash redirect.
export default function ProtectedRoute() {
   const { user, ready } = useAuth();
   const location = useLocation();

   if (!ready) return <Loader page />;
   if (!user)
      return <Navigate to="/login" replace state={{ from: location }} />;
   return <Outlet />;
}
