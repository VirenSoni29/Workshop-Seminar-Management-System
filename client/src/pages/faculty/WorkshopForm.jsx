import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
   ArrowLeft,
   ArrowRight,
   Save,
   CalendarDays,
   Calendar,
   MapPin,
} from "lucide-react";
import {
   getWorkshopApi,
   createWorkshopApi,
   updateWorkshopApi,
   submitWorkshopApi,
} from "../../api/workshops.api";
import useAuth from "../../hooks/useAuth";
import useForm from "../../hooks/useForm";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import FormInput from "../../components/forms/FormInput";
import FormSelect from "../../components/forms/FormSelect";
import FormTextarea from "../../components/forms/FormTextarea";
import { notify } from "../../utils/notify";
import { getErrorMessage, getFieldErrors } from "../../utils/getErrorMessage";
import {
   formatDateTime,
   toDateTimeLocal,
   toISO,
} from "../../utils/formatDate";
import {
   HOME_BY_ROLE,
   STATUS_LABELS,
   WORKSHOP_TYPES,
   WORKSHOP_MODES,
   MODE_LABELS,
   EDITABLE_STATUSES,
} from "../../utils/constants";

const EMPTY = {
   title: "",
   type: "",
   department: "",
   speaker: "",
   description: "",
   mode: "",
   venue: "",
   meetingLink: "",
   startDate: "",
   endDate: "",
   registrationDeadline: "",
   capacity: "",
};

const validate = (v) => {
   const e = {};
   if (!v.title.trim()) e.title = "Title is required";
   if (!v.type) e.type = "Select a type";
   if (!v.department.trim()) e.department = "Department is required";
   if (!v.speaker.trim()) e.speaker = "Speaker is required";
   if (!v.description.trim()) e.description = "Description is required";
   if (!v.mode) e.mode = "Select a mode";
   if (v.mode === "offline" && !v.venue.trim()) e.venue = "Venue is required";
   if (v.mode === "online" && !v.meetingLink.trim())
      e.meetingLink = "Meeting link is required";
   if (!v.startDate) e.startDate = "Start date and time are required";
   if (!v.endDate) e.endDate = "End date and time are required";
   if (v.startDate && v.endDate && v.endDate <= v.startDate)
      e.endDate = "End must be after the start";
   if (
      v.registrationDeadline &&
      v.startDate &&
      v.registrationDeadline > v.startDate.slice(0, 10)
   )
      e.registrationDeadline = "Deadline must be on or before the start date";
   if (!v.registrationDeadline)
      e.registrationDeadline = "Registration deadline is required";
   if (!(Number(v.capacity) >= 1)) e.capacity = "Capacity must be at least 1";
   if (v.startDate && v.endDate && v.endDate < v.startDate)
      e.endDate = "End date cannot be before start date";
   if (
      v.registrationDeadline &&
      v.startDate &&
      v.registrationDeadline > v.startDate
   )
      e.registrationDeadline = "Deadline must be on or before the start date";
   return e;
};

export default function WorkshopForm() {
   const { id } = useParams();
   const isEdit = Boolean(id);
   const navigate = useNavigate();
   const { user } = useAuth();
   const actionRef = useRef("draft");
   const home = HOME_BY_ROLE[user?.role] || "/";

   const {
      data: existing,
      loading,
      error,
   } = useFetch(() => getWorkshopApi(id), [id], { immediate: isEdit });

   const form = useForm({
      initialValues: EMPTY,
      onSubmit: async (values, { setServerErrors }) => {
         const errs = validate(values);
         if (Object.keys(errs).length) {
            setServerErrors(errs);
            notify.error("Please fix the highlighted fields");
            return;
         }

         const payload = {
            title: values.title.trim(),
            type: values.type,
            department: values.department.trim(),
            speaker: values.speaker.trim(),
            description: values.description.trim(),
            mode: values.mode,
            startDate: toISO(values.startDate),
            endDate: toISO(values.endDate),
            registrationDeadline: toISO(values.registrationDeadline),
            capacity: Number(values.capacity),
            ...(values.mode === "offline"
               ? { venue: values.venue.trim() }
               : { meetingLink: values.meetingLink.trim() }),
         };

         try {
            const res = isEdit
               ? await updateWorkshopApi(id, payload)
               : await createWorkshopApi(payload);
            const saved = res?.data?.data;
            const workshopId = saved?._id || saved?.id || id;

            if (actionRef.current === "pending") {
               await submitWorkshopApi(workshopId);
               notify.success("Workshop submitted for approval");
            } else {
               notify.success(
                  isEdit ? "Workshop updated" : "Workshop saved as draft",
               );
            }
            navigate("/faculty/workshops");
         } catch (err) {
            const fieldErrors = getFieldErrors(err);
            if (fieldErrors && Object.keys(fieldErrors).length)
               setServerErrors(fieldErrors);
            notify.error(getErrorMessage(err));
         }
      },
   });

   const { values, setValues, isSubmitting, handleSubmit, getFieldProps } =
      form;

   // Fill the form in edit mode
   useEffect(() => {
      if (!isEdit || !existing) return;
      const w = existing.workshop || existing;
      setValues({
         title: w.title || "",
         type: w.type || "",
         department: w.department || "",
         speaker: w.speaker || "",
         description: w.description || "",
         mode: w.mode || "",
         venue: w.venue || "",
         meetingLink: w.meetingLink || "",
         startDate: toDateTimeLocal(w.startDate),
         endDate: toDateTimeLocal(w.endDate),
         registrationDeadline: toDateTimeLocal(w.registrationDeadline),
         capacity: w.capacity ?? "",
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [existing, isEdit]);

   const status = (existing?.workshop || existing)?.status || "draft";
   const locked =
      isEdit &&
      existing &&
      !EDITABLE_STATUSES.includes(status) &&
      status !== "rejected";
   const online = values.mode === "online";
   const offline = values.mode === "offline";
   const location = online ? values.meetingLink : values.venue;
   const dateText = (v) => (v ? formatDateTime(new Date(v)) : '');

   if (isEdit && loading) return <Loader page text="Loading workshop..." />;
   if (isEdit && error) return <EmptyState message={error} />;
   if (locked)
      return (
         <EmptyState message="This workshop can no longer be edited because it is already under review or published." />
      );

   return (
      <>
         <div className="page-heading">
            <Link className="btn btn-ghost btn-sm" to={home}>
               <ArrowLeft size={14} />
               Back to dashboard
            </Link>
            <div style={{ marginTop: "var(--sp-4)" }}>
               <span className="eyebrow">WORKSHOP MANAGEMENT</span>
               <h1>{isEdit ? "Edit workshop" : "Create workshop"}</h1>
               <p>
                  Enter the event details. You can save it as a draft or submit
                  it for approval.
               </p>
            </div>
         </div>

         <form onSubmit={handleSubmit} noValidate>
            <div className="form-layout">
               <div>
                  <section className="card form-section">
                     <h2>Basic information</h2>
                     <p>Provide the event details and select its category.</p>
                     <div className="form-grid">
                        <div className="field-full">
                           <FormInput
                              label="Title *"
                              placeholder="e.g. Introduction to Machine Learning"
                              {...getFieldProps("title")}
                           />
                        </div>
                        <FormSelect
                           label="Type *"
                           placeholder="Select type"
                           options={WORKSHOP_TYPES.map((t) => ({
                              value: t,
                              label: t,
                           }))}
                           {...getFieldProps("type")}
                        />
                        <FormInput
                           label="Department *"
                           placeholder="e.g. Information Technology"
                           {...getFieldProps("department")}
                        />
                        <div className="field-full">
                           <FormInput
                              label="Speaker *"
                              placeholder="Speaker / instructor name"
                              {...getFieldProps("speaker")}
                           />
                        </div>
                        <div className="field-full">
                           <FormTextarea
                              label="Description *"
                              placeholder="Describe the event and what attendees will learn..."
                              {...getFieldProps("description")}
                           />
                        </div>
                     </div>
                  </section>

                  <section className="card form-section">
                     <h2>Mode &amp; location</h2>
                     <p>
                        Select online or offline. The relevant location field
                        will appear based on your selection.
                     </p>
                     <div className="form-grid">
                        <FormSelect
                           label="Mode *"
                           placeholder="Select mode"
                           options={WORKSHOP_MODES.map((m) => ({
                              value: m,
                              label: MODE_LABELS?.[m] || m,
                           }))}
                           {...getFieldProps("mode")}
                        />
                        {offline && (
                           <FormInput
                              label="Venue *"
                              placeholder="e.g. Seminar Hall B"
                              {...getFieldProps("venue")}
                           />
                        )}
                        {online && (
                           <div className="field-full">
                              <FormInput
                                 label="Meeting link *"
                                 type="url"
                                 placeholder="https://meeting-link.example"
                                 {...getFieldProps("meetingLink")}
                              />
                           </div>
                        )}
                     </div>
                  </section>

                  <section className="card form-section">
                     <h2>Schedule &amp; registration</h2>
                     <p>
                        Define the event dates, registration closing date and
                        maximum capacity.
                     </p>
                     <div className="form-grid">
                        <FormInput
                           label="Start date & time *"
                           type="datetime-local"
                           {...getFieldProps("startDate")}
                        />
                        <FormInput
                           label="End date & time *"
                           type="datetime-local"
                           {...getFieldProps("endDate")}
                        />
                        <FormInput
                           label="Registration deadline *"
                           type="datetime-local"
                           {...getFieldProps("registrationDeadline")}
                        />
                        <FormInput
                           label="Capacity *"
                           type="number"
                           min="1"
                           step="1"
                           placeholder="e.g. 60"
                           {...getFieldProps("capacity")}
                        />
                     </div>
                  </section>

                  <section className="card form-section">
                     <h2>Ownership &amp; status</h2>
                     <p>
                        Ownership is assigned automatically. Status follows the
                        workshop approval lifecycle.
                     </p>
                     <div className="form-grid">
                        <div className="field">
                           <label htmlFor="createdBy">Created by</label>
                           <input
                              className="input"
                              id="createdBy"
                              name="createdBy"
                              value={user?.name || ""}
                              readOnly
                           />
                           <span className="field-hint">
                              Automatically taken from the signed-in faculty
                              account.
                           </span>
                        </div>
                     </div>
                  </section>

                  <div className="form-actions">
                     <Link
                        className="btn btn-secondary"
                        to="/faculty/workshops"
                     >
                        Cancel
                     </Link>
                     <button
                        className="btn btn-secondary"
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => (actionRef.current = "draft")}
                     >
                        <Save size={16} />
                        Save as draft
                     </button>
                     <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => (actionRef.current = "pending")}
                     >
                        Submit for approval <ArrowRight size={16} />
                     </button>
                  </div>
               </div>

               <aside className="form-aside">
                  <section className="card preview-card">
                     <div
                        className="row-between"
                        style={{ marginBottom: "var(--sp-3)" }}
                     >
                        <h2 style={{ fontSize: "var(--fs-lg)" }}>
                           Event preview
                        </h2>
                        <StatusBadge
                           status={status}
                           label={STATUS_LABELS[status] || "Draft"}
                        />
                     </div>
                     <div className="preview-banner">
                        <span className="badge badge--info">
                           {values.type || "Workshop"}
                        </span>
                        <CalendarDays size={18} />
                     </div>
                     <h3>{values.title.trim() || "Workshop title"}</h3>
                     <p>
                        <Calendar
                           size={14}
                           style={{ verticalAlign: "-.15em" }}
                        />{" "}
                        {values.startDate || values.endDate
                           ? `${dateText(values.startDate) || "Start date"}${values.endDate ? ` – ${dateText(values.endDate)}` : ""}`
                           : "Event dates will appear here"}
                     </p>
                     <p style={{ marginTop: "var(--sp-2)" }}>
                        <MapPin size={14} style={{ verticalAlign: "-.15em" }} />{" "}
                        {location
                           ? `${online ? "Online" : "Offline"}: ${location}`
                           : "Venue or meeting link"}
                     </p>
                     <hr style={{ margin: "var(--sp-4) 0" }} />
                     <p className="field-hint">
                        Registration count is maintained by the system.
                        Submitted workshops enter the approval process.
                     </p>
                  </section>
               </aside>
            </div>
         </form>
      </>
   );
}
