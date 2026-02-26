const defaultIllustrations = {
  empty: (
    <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 48 48">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M20 8H10a2 2 0 00-2 2v28a2 2 0 002 2h28a2 2 0 002-2V18M30 8l10 10M30 8v10h10" />
    </svg>
  ),
  search: (
    <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 48 48">
      <circle cx="20" cy="20" r="12" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M29 29l10 10" />
    </svg>
  ),
  notification: (
    <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 48 48">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M18 38h12M24 6v2M38 26c0-7.7-6.3-14-14-14S10 18.3 10 26v6h28v-6z" />
    </svg>
  )
};

export default function EmptyState({
  icon = "empty",
  title = "Nothing here yet",
  description = "",
  action = null,
  className = ""
}) {
  return (
    <div className={`card text-center py-12 space-y-3 ${className}`}>
      {typeof icon === "string" ? defaultIllustrations[icon] || defaultIllustrations.empty : icon}
      <h3 className="text-lg font-medium text-slate-700">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
