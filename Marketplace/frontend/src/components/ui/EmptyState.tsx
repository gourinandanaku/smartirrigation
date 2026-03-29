export default function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="form" role="status" aria-live="polite">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

