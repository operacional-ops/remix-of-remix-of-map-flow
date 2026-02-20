const PainelDRX = () => {
  return (
    <div className="h-full w-full">
      <iframe
        src="/dashboard-operacao-v3.html"
        className="w-full h-full border-0"
        title="Painel DRX"
        allow="camera;microphone"
      />
    </div>
  );
};

export default PainelDRX;
