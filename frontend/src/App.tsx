import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmailProvider, useEmail } from './context/EmailContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ComposeView } from './views/ComposeView';
import { EmailDetailView } from './views/EmailDetailView';
import { LoginView } from './views/LoginView';

// Default Google OAuth Client ID (can be configured via VITE_GOOGLE_CLIENT_ID env)
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '102938475610-exampleclientid123456789.apps.googleusercontent.com';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { selectedEmail, isComposing } = useEmail();

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans">
      {/* Permanent Left Sidebar matching Figma */}
      <Sidebar />

      {/* Dynamic Main Stage */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {selectedEmail ? (
          <EmailDetailView />
        ) : isComposing ? (
          <ComposeView />
        ) : (
          <DashboardView />
        )}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <EmailProvider>
          <AppContent />
        </EmailProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
