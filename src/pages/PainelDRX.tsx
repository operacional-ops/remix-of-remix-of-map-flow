const PainelDRX = () => {
  return (
    <div className="w-full h-[calc(100vh-68px)] md:h-[calc(100vh-80px)]">
      <iframe
        key="drx-flow-frame"
        src="/painel-drx.html"
        className="w-full h-full border-0"
        title="Painel DRX"
        allow="camera;microphone"
      />
    </div>
  );
};

export default PainelDRX;
