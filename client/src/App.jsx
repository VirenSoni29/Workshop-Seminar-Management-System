import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';

// Lives inside ThemeProvider so it can follow the site's light/dark theme.
function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} richColors closeButton position="top-right" />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <ThemedToaster />
    </ThemeProvider>
  );
}