// Official SplitEasy artwork (BRAND-001). Do not redesign; files live in public/brand.
// Both variants render; the .dark class on <html> picks one, so no hydration mismatch.
export function BrandLogo({ className = "h-10" }: { className?: string }) {
  return (
    <>
      <img src="/brand/spliteasy-logo-light.png" alt="SplitEasy" width={1100} height={299} className={`${className} w-auto dark:hidden`} />
      <img src="/brand/spliteasy-logo-dark.png" alt="SplitEasy" width={1100} height={299} className={`${className} hidden w-auto dark:block`} />
    </>
  );
}

export function BrandIcon({ className = "size-9" }: { className?: string }) {
  return <img src="/brand/spliteasy-icon-256.png" alt="SplitEasy" width={256} height={256} className={className} />;
}
