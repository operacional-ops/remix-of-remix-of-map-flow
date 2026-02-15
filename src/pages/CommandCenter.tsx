const CommandCenter = () => {
  return (
    <div className="h-full w-full">
      <iframe
        src="/command-center.html"
        className="w-full h-full border-0"
        title="DRX Command Center"
        allow="camera;microphone"
      />
    </div>
  );
};

export default CommandCenter;
