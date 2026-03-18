export default function Spinner({ size = "md", label = "Loading...", className = "" }) {
  const sizeClass = size === "lg" ? "spinner-lg" : "spinner";

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
      <div className={`${sizeClass} text-teal-500`} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
