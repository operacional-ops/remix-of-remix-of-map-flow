import { useEffect, useRef } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';

export default function DashboardOperacao() {
  const { activeWorkspace } = useWorkspace();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const sendAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'AUTH_TOKEN',
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }, '*');
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REQUEST_AUTH') {
        sendAuth();
      }
      if (event.data?.type === 'REQUEST_WORKSPACE' && activeWorkspace?.id && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'WORKSPACE_ID',
          workspaceId: activeWorkspace.id,
        }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeWorkspace?.id]);

  const src = activeWorkspace?.id
    ? `/dashboard-operacao.html?workspace=${activeWorkspace.id}`
    : '/dashboard-operacao.html';

  return (
    <div className="h-full w-full">
      <iframe
        ref={iframeRef}
        src={src}
        className="w-full h-full border-0"
        title="Dashboard Operacional DRX"
        onLoad={() => {
          // Send auth + workspace on load
          const sendData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage({
                type: 'AUTH_TOKEN',
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }, '*');
              if (activeWorkspace?.id) {
                setTimeout(() => {
                  iframeRef.current?.contentWindow?.postMessage({
                    type: 'WORKSPACE_ID',
                    workspaceId: activeWorkspace.id,
                  }, '*');
                }, 500);
              }
            }
          };
          sendData();
        }}
      />
    </div>
  );
}
