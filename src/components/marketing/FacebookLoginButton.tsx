import { useState, useEffect, useCallback } from 'react';
import { Facebook, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useFacebookConnection, useSaveFacebookConnection, useDisconnectFacebook } from '@/hooks/useFacebookConnections';

const FB_APP_ID = '1938349836774831';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

function loadFbSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (window.FB) { resolve(); return; }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });
      resolve();
    };

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

export default function FacebookLoginButton() {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { data: connection, isLoading } = useFacebookConnection(activeWorkspace?.id);
  const saveConnection = useSaveFacebookConnection();
  const disconnectFb = useDisconnectFacebook();
  const [sdkReady, setSdkReady] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    loadFbSdk().then(() => setSdkReady(true));
  }, []);

  const handleLogin = useCallback(() => {
    if (!sdkReady || !user || !activeWorkspace) return;
    setLoggingIn(true);

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const { accessToken, expiresIn, userID } = response.authResponse;
          // Get user name
          window.FB.api('/me', { fields: 'name' }, (meData: any) => {
            saveConnection.mutate({
              userId: user.id,
              workspaceId: activeWorkspace.id,
              fbUserId: userID,
              fbUserName: meData.name || 'Usuário Facebook',
              accessToken,
              expiresIn,
            });
            setLoggingIn(false);
          });
        } else {
          setLoggingIn(false);
        }
      },
      { scope: 'ads_read,ads_management,business_management' }
    );
  }, [sdkReady, user, activeWorkspace, saveConnection]);

  const handleDisconnect = useCallback(() => {
    if (connection) {
      disconnectFb.mutate(connection.id);
    }
  }, [connection, disconnectFb]);

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...
      </Button>
    );
  }

  if (connection) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Facebook className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {connection.fb_user_name}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-muted-foreground hover:text-destructive gap-1.5">
          <LogOut className="h-3.5 w-3.5" /> Desconectar
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      disabled={!sdkReady || loggingIn}
      className="bg-[#1877F2] hover:bg-[#166FE5] text-white gap-2"
      size="sm"
    >
      {loggingIn ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Facebook className="h-4 w-4" />
      )}
      Conectar com Facebook
    </Button>
  );
}
