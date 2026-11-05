const getInitials = (name = "") =>
   name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";

// <PersonCell name="Aanya Sharma" email="aanya@skit.ac.in" />
export default function PersonCell({ name, email }) {
   return (
      <div className="person">
         <span className="person__avatar">{getInitials(name)}</span>
         <div>
            <div className="person__name">{name}</div>
            {email && <div className="person__email">{email}</div>}
         </div>
      </div>
   );
}
