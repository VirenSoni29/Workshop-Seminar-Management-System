import clsx from "clsx";

// <Loader />                      section loader (40vh)
// <Loader page />                 full-screen (auth rehydrate, route guards)
// <Loader text="Loading..." />    custom text
// <Spinner /> alone is for inside buttons / small spots
export function Spinner({ large = false, className }) {
   return (
      <div
         className={clsx("spinner", large && "spinner--lg", className)}
         role="status"
         aria-label="Loading"
      />
   );
}

export default function Loader({
   page = false,
   text = "Loading...",
   className,
}) {
   return (
      <div className={clsx("loader", page && "loader--page", className)}>
         <Spinner large={page} />
         <span>{text}</span>
      </div>
   );
}
