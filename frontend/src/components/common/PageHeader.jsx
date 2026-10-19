export default function PageHeader({ eyebrow, titulo, children }) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 md:pt-16">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-4xl font-bold sm:text-[2.75rem]">{titulo}</h1>
        {children && <div className="mt-4 max-w-2xl text-lg text-ink-soft">{children}</div>}
      </div>
    </div>
  );
}
