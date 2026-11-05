import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { HOME_BY_ROLE } from "../utils/constants";

// <RoleRoute roles={['faculty', 'admin']} />
// Wrong role -> sent to their own dashboard. Always nested inside ProtectedRoute.
export default function RoleRoute({ roles }) {
   const { user } = useAuth();

   if (!roles.includes(user.role)) {
      return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
   }
   return <Outlet />;
}
