import { useEffect } from 'react';

const UTMFYTeste = () => {
  useEffect(() => {
    // Redireciona para o HTML estático
    window.location.href = '/utmfy-teste.html';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Carregando UTMFY-teste...</p>
      </div>
    </div>
  );
};

export default UTMFYTeste;
