export function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <span>{count} items</span>
    </div>
  );
}
