import { Route, Routes } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import GuestRoute from './GuestRoute';
import { ROLES } from '../utils/constants';
import Login from '../pages/public/Login';
import Signup from '../pages/public/Signup';
import Landing from '../pages/public/Landing';
import StudentDashboard from '../pages/student/StudentDashboard';
import Browse from '../pages/student/Browse';
import WorkshopDetails from '../pages/student/WorkshopDetails';
import MyRegistrations from '../pages/student/MyRegistrations';
import MyCertificates from '../pages/student/MyCertificates';
import VerifyCertificate from '../pages/public/VerifyCertificate';
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import MyWorkshops from '../pages/faculty/MyWorkshops';
import WorkshopForm from '../pages/faculty/WorkshopForm';
import AttendeeList from '../pages/faculty/AttendeeList';
import QRScanner from '../pages/faculty/QRScanner';
import AdminDashboard from '../pages/admin/AdminDashboard';
import PendingApprovals from '../pages/admin/PendingApprovals';
import AllWorkshops from '../pages/admin/AllWorkshops';
import ManageUsers from '../pages/admin/ManageUsers';
import NotFound from '../pages/NotFound';
import Reports from '../pages/admin/Reports';
import ActivityLog from '../pages/admin/ActivityLog';

// TEMPORARY: replace each todo('...') with the real page as we build it.
// const Placeholder = ({ name }) => (
//    <div className="card">
//       <div className="card-body">
//          <h2>{name}</h2>
//          <p>Page not built yet.</p>
//       </div>
//    </div>
// );
// const todo = (name) => <Placeholder name={name} />;

const { ADMIN, FACULTY, STUDENT } = ROLES;

export default function AppRoutes() {
   return (
      <Routes>
         {/* Public, with the landing header/footer */}
         <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
         </Route>

         {/* Guests only (own .auth shell, no layout) */}
         <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
         </Route>

         {/* Logged in: navbar + sidebar shell */}
         <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
               {/* any role */}
               <Route path="/workshops" element={<Browse />} />
               <Route path="/workshops/:id" element={<WorkshopDetails />} />

               {/* student + faculty */}
               <Route element={<RoleRoute roles={[STUDENT, FACULTY]} />}>
                  <Route path="/my-registrations" element={<MyRegistrations />} />
                  <Route path="/my-certificates" element={<MyCertificates />} />
               </Route>

               {/* student */}
               <Route element={<RoleRoute roles={[STUDENT]} />}>
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
               </Route>

               {/* faculty + admin */}
               <Route element={<RoleRoute roles={[FACULTY, ADMIN]} />}>
                  <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                  <Route path="/faculty/workshops" element={<MyWorkshops />} />
                  <Route path="/faculty/workshops/new" element={<WorkshopForm />} />
                  <Route path="/faculty/workshops/:id/edit" element={<WorkshopForm />} />
                  <Route path="/faculty/workshops/:id/attendees" element={<AttendeeList />} />
                  <Route path="/faculty/scan" element={<QRScanner />} />
               </Route>

               {/* admin */}
               <Route element={<RoleRoute roles={[ADMIN]} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/approvals" element={<PendingApprovals />} />
                  <Route path="/admin/workshops" element={<AllWorkshops />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                  <Route path="/admin/reports" element={<Reports />} />
                  <Route path="/admin/activity" element={<ActivityLog />} />
               </Route>
            </Route>
         </Route>

         <Route path="*" element={<NotFound />} />
      </Routes>
   );
}