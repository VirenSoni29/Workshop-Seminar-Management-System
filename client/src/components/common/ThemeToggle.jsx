import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// Renders only the button. Its parent decides the layout (see the note below).
// Your CSS shows/hides the right icon from <html data-theme>, so both icons are rendered.
export default function ThemeToggle({ className = "" }) {
   const { toggleTheme, isDark } = useTheme();

   return (
      <button
         type="button"
         className={`btn btn-ghost btn-icon theme-toggle ${className}`.trim()}
         onClick={toggleTheme}
         aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
         <Moon className="icon-moon" />
         <Sun className="icon-sun" />
      </button>
   );
}
