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

// TEMPORARY: replace each todo('...') with the real page as we build it.
const Placeholder = ({ name }) => (
   <div className="card">
      <div className="card-body">
         <h2>{name}</h2>
         <p>Page not built yet.</p>
      </div>
   </div>
);
const todo = (name) => <Placeholder name={name} />;

const { ADMIN, FACULTY, STUDENT } = ROLES;

export default function AppRoutes() {
   return (
      <Routes>
         {/* Public, with the landing header/footer */}
         <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/verify/:certificateId" element={todo('Verify certificate')} />
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
                  <Route path="/faculty/dashboard" element={todo('Faculty dashboard')} />
                  <Route path="/faculty/workshops" element={todo('My workshops')} />
                  <Route path="/faculty/workshops/new" element={todo('Create workshop')} />
                  <Route path="/faculty/workshops/:id/edit" element={todo('Edit workshop')} />
                  <Route path="/faculty/workshops/:id/attendees" element={todo('Attendee list')} />
                  <Route path="/faculty/scan" element={todo('QR scanner')} />
               </Route>

               {/* admin */}
               <Route element={<RoleRoute roles={[ADMIN]} />}>
                  <Route path="/admin/dashboard" element={todo('Admin dashboard')} />
                  <Route path="/admin/approvals" element={todo('Pending approvals')} />
                  <Route path="/admin/workshops" element={todo('All workshops')} />
                  <Route path="/admin/users" element={todo('Manage users')} />
               </Route>
            </Route>
         </Route>

         <Route path="*" element={todo('404 Not found')} />
      </Routes>
   );
}