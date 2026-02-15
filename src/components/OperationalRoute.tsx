import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface OperationalRouteProps {
  children: React.ReactNode;
}

export const OperationalRoute = ({ children }: OperationalRouteProps) => {
  const { data: userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userRole?.isLimitedMember) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
