type PageTitleProps = {
  label: string;
  title: string;
  description?: string;
};

export default function PageTitle({ label, title, description }: PageTitleProps) {
  return (
    <header className="pb-6">
      <p className="label">{label}</p>
      <h1 className="display mt-3 text-5xl sm:text-6xl">{title}</h1>
      {description && (
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
          {description}
        </p>
      )}
    </header>
  );
}
