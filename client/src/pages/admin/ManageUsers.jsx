import { useState } from "react";
import {
   Search,
   UserPlus,
   Users,
   GraduationCap,
   BriefcaseBusiness,
} from "lucide-react";
import clsx from "clsx";
import Modal from "../../components/common/Modal";
import FormSelect from "../../components/forms/FormSelect";
import {
   getUsersApi,
   updateUserStatusApi,
   updateUserRoleApi,
} from "../../api/users.api";
import { getStatsApi } from "../../api/stats.api";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import usePagination from "../../hooks/usePagination";
import useAuth from "../../hooks/useAuth";
import DataTable from "../../components/common/DataTable";
import ConfirmModal from "../../components/common/ConfirmModal";
import StatCard from "../../components/common/StatCard";
import { getInitials } from "../../utils/getInitials";
import { notify } from "../../utils/notify";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { formatDate } from "../../utils/formatDate";
import { ROLES, ROLE_LABELS } from "../../utils/constants";

const PAGE_SIZE = 10;
const idOf = (u) => u._id || u.id;

export default function ManageUsers() {
   const { user: me } = useAuth();
   const { page, setPage, reset } = usePagination(PAGE_SIZE);
   const [search, setSearch] = useState("");
   const [role, setRole] = useState("all");
   const [status, setStatus] = useState("all");
   const debounced = useDebounce(search, 300);

   const [target, setTarget] = useState(null); // user being toggled
   const [busy, setBusy] = useState(false);

   const [roleTarget, setRoleTarget] = useState(null); // user whose role is being changed
   const [newRole, setNewRole] = useState("");

   const stats = useFetch(() => getStatsApi(), []);
   const users = useFetch(
      () =>
         getUsersApi({
            page,
            limit: PAGE_SIZE,
            ...(debounced.trim() && { search: debounced.trim() }),
            ...(role !== "all" && { role }),
            ...(status !== "all" && { isActive: status === "active" }),
         }),
      [page, debounced, role, status],
   );

   const t = stats.data?.totals;
   const byRole = stats.data?.users || {};
   const list = Array.isArray(users.data) ? users.data : [];

   const isActive = (u) => u.isActive !== false;
   const nextActive = target ? !isActive(target) : false;

   const confirm = async () => {
      setBusy(true);
      try {
         await updateUserStatusApi(idOf(target), nextActive);
         notify.success(
            nextActive ? "Account activated" : "Account deactivated",
         );
         setTarget(null);
         users.refetch();
      } catch (err) {
         notify.error(getErrorMessage(err));
      } finally {
         setBusy(false);
      }
   };

   const openRole = (u) => {
      setRoleTarget(u);
      setNewRole(u.role);
   };

   const saveRole = async () => {
      if (!newRole || newRole === roleTarget.role) {
         setRoleTarget(null);
         return;
      }
      setBusy(true);
      try {
         await updateUserRoleApi(idOf(roleTarget), newRole);
         notify.success(`Role changed to ${ROLE_LABELS?.[newRole] || newRole}`);
         setRoleTarget(null);
         users.refetch();
         stats.refetch();
      } catch (err) {
         notify.error(getErrorMessage(err));
      } finally {
         setBusy(false);
      }
   };

   const columns = [
      {
         key: "user",
         header: "User",
         render: (u) => (
            <div className="person">
               <span className="person__avatar">{getInitials(u.name)}</span>
               <div>
                  <div className="person__name">{u.name}</div>
                  <div className="person__email">
                     {[u.email, u.identifier].filter(Boolean).join(" · ")}
                  </div>
               </div>
            </div>
         ),
      },
      {
         key: "role",
         header: "Role",
         render: (u) => (
            <span className="tw:text-(length:--fs-sm) tw:font-medium">
               {ROLE_LABELS?.[u.role] || u.role}
            </span>
         ),
      },
      {
         key: "department",
         header: "Department",
         render: (u) => u.department || "-",
      },
      {
         key: "joined",
         header: "Joined",
         render: (u) => (u.createdAt ? formatDate(u.createdAt) : "-"),
      },
      {
         key: "status",
         header: "Account status",
         render: (u) => (
            <span
               className={clsx(
                  "badge",
                  isActive(u) ? "badge--success" : "badge--neutral",
               )}
            >
               {isActive(u) ? "Active" : "Inactive"}
            </span>
         ),
      },
      {
         key: "actions",
         header: "Actions",
         render: (u) =>
            idOf(u) === (me?._id || me?.id) ? (
               <span className="text-secondary">Current account</span>
            ) : (
               <div className="tw:flex tw:items-center tw:gap-(--sp-2)">
                  <button
                     type="button"
                     className="btn btn-secondary btn-sm"
                     onClick={() => openRole(u)}
                  >
                     Change role
                  </button>
                  <button
                     type="button"
                     className={clsx(
                        "btn btn-ghost btn-sm",
                        isActive(u) && "tw:text-(--danger,#b42318)!",
                     )}
                     onClick={() => setTarget(u)}
                  >
                     {isActive(u) ? "Deactivate" : "Activate"}
                  </button>
               </div>
            ),
      },
   ];

   return (
      <>
         <section className="page-heading">
            <span className="eyebrow">ADMINISTRATION</span>
            <h1>Manage users</h1>
            <p>View registered accounts and manage their platform access.</p>
         </section>

         <section className="grid-stats">
            <StatCard
               icon={Users}
               label="Total users"
               value={stats.loading ? "-" : (t?.users ?? 0).toLocaleString()}
               hint="All accounts"
            />
            <StatCard
               icon={GraduationCap}
               label="Students"
               value={
                  stats.loading
                     ? "-"
                     : (byRole[ROLES.STUDENT] ?? 0).toLocaleString()
               }
               hint="Student accounts"
            />
            <StatCard
               icon={BriefcaseBusiness}
               label="Faculty"
               value={
                  stats.loading
                     ? "-"
                     : (byRole[ROLES.FACULTY] ?? 0).toLocaleString()
               }
               hint="Faculty accounts"
            />
         </section>

         <section className="card" style={{ marginTop: "var(--sp-8)" }}>
            <div className="card-header row-between">
               <div>
                  <h2>User directory</h2>
                  <p
                     className="text-secondary"
                     style={{ fontSize: "var(--fs-sm)" }}
                  >
                     Search accounts, filter by role and manage access.
                  </p>
               </div>
               <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  disabled
                  title="Not available yet"
               >
                  <UserPlus size={16} />
                  Invite user
               </button>
            </div>

            <div className="card-body">
               <div className="toolbar">
                  <div className="input-wrap">
                     <Search className="input-icon" />
                     <input
                        className="input"
                        type="search"
                        placeholder="Search name, email or roll number..."
                        aria-label="Search users"
                        value={search}
                        onChange={(e) => {
                           setSearch(e.target.value);
                           reset();
                        }}
                     />
                  </div>
                  <select
                     className="input"
                     aria-label="Filter by role"
                     value={role}
                     onChange={(e) => {
                        setRole(e.target.value);
                        reset();
                     }}
                  >
                     <option value="all">All roles</option>
                     {Object.values(ROLES).map((r) => (
                        <option key={r} value={r}>
                           {ROLE_LABELS?.[r] || r}
                        </option>
                     ))}
                  </select>
                  <select
                     className="input"
                     aria-label="Filter by account status"
                     value={status}
                     onChange={(e) => {
                        setStatus(e.target.value);
                        reset();
                     }}
                  >
                     <option value="all">All statuses</option>
                     <option value="active">Active</option>
                     <option value="inactive">Inactive</option>
                  </select>
               </div>

               <DataTable
                  columns={columns}
                  rows={list}
                  rowKey={idOf}
                  loading={users.loading}
                  error={users.error}
                  emptyMessage="No users match your search or filters."
                  meta={users.meta}
                  onPageChange={setPage}
                  itemLabel="users"
               />
            </div>
         </section>

         <ConfirmModal
            open={Boolean(target)}
            onClose={() => !busy && setTarget(null)}
            onConfirm={confirm}
            title={
               nextActive
                  ? "Activate this account?"
                  : "Deactivate this account?"
            }
            message={
               nextActive
                  ? "The user will regain access to the platform."
                  : "The user will no longer be able to access the platform."
            }
            confirmText={nextActive ? "Activate" : "Deactivate"}
            danger={!nextActive}
            loading={busy}
         />

         <Modal
            open={Boolean(roleTarget)}
            onClose={() => !busy && setRoleTarget(null)}
            title="Change role"
            size="sm"
            footer={
               <>
                  <button
                     type="button"
                     className="btn btn-secondary"
                     onClick={() => setRoleTarget(null)}
                     disabled={busy}
                  >
                     Cancel
                  </button>
                  <button
                     type="button"
                     className="btn btn-primary"
                     onClick={saveRole}
                     disabled={busy}
                  >
                     {busy ? "Saving..." : "Save role"}
                  </button>
               </>
            }
         >
            <p className="text-secondary" style={{ marginTop: 0 }}>
               <strong>{roleTarget?.name}</strong> · {roleTarget?.email}
            </p>
            <FormSelect
               label="Role"
               name="role"
               value={newRole}
               onChange={(e) => setNewRole(e.target.value)}
               options={Object.values(ROLES).map((r) => ({
                  value: r,
                  label: ROLE_LABELS?.[r] || r,
               }))}
            />
            <small className="text-secondary">
               The user's access changes the next time they sign in or refresh.
            </small>
         </Modal>
      </>
   );
}
