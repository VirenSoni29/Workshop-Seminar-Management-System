// <PageHeader eyebrow="..." title="..." subtitle="..." action={<Link .../>} />
export default function PageHeader({ eyebrow, title, subtitle, action }) {
   return (
      <section className="dashboard-heading row-between">
         <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
         </div>
         {action}
      </section>
   );
}
