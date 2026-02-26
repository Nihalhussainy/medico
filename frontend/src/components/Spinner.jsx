export default function Spinner({ size = "md", label = "Loading...", className = "" }) {
  const sizeClass = size === "lg" ? "spinner-lg" : "spinner";
  
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <div className={`${sizeClass} text-emerald-500`} />
      {label && <p className="text-sm text-slate-500 animate-pulse">{label}</p>}
    </div>
  );
}
