export default function Loading() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-indicator" aria-hidden="true" />
      <span className="sr-only">Carregando página...</span>
    </div>
  );
}
