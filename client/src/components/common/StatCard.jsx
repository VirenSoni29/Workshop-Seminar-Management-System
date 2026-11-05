// <StatCard icon={Ticket} label="..." value={3} hint="..." />
export default function StatCard({ icon: Icon, label, value, hint }) {
   const display =
      typeof value === "number" && value < 10
         ? String(value).padStart(2, "0")
         : value;
   return (
      <article className="card stat-card">
         <span className="icon-box">
            <Icon />
         </span>
         <div>
            <div className="stat-card__label">{label}</div>
            <div className="stat-card__value">{display}</div>
            {hint && <div className="stat-card__hint">{hint}</div>}
         </div>
      </article>
   );
}
