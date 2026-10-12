import { Link } from "react-router";
import { LockKeyhole, Plus, ShieldCheck } from "lucide-react";

function TrustIllustration() {
  return (
    <div className="relative mx-auto my-7 h-64 w-72" aria-hidden="true">
      {["size-28", "size-48", "size-64 border-dashed"].map((size) => (
        <div
          key={size}
          className={`absolute top-1/2 left-1/2 -translate-1/2 rounded-full border border-brand-foreground/15 ${size}`}
        />
      ))}
      <div className="absolute top-1/2 left-1/2 grid h-22 w-20 -translate-1/2 -rotate-9 place-items-center rounded-3xl bg-brand-accent text-brand shadow-xl">
        <LockKeyhole className="size-9 rotate-9" />
      </div>
      <Plus className="absolute top-8 left-10 size-6 text-brand-accent" />
      <Plus className="absolute right-5 bottom-12 size-4 text-brand-accent" />
      <span className="absolute top-20 right-12 size-2 rounded-full bg-brand-accent" />
      <span className="absolute bottom-16 left-12 size-2 rounded-full bg-brand-accent" />
      <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 -rotate-4 items-center gap-2 rounded-md border border-brand-foreground/25 bg-brand px-4 py-3 text-xs whitespace-nowrap text-brand-accent shadow-lg">
        <span className="size-1.5 rounded-full bg-brand-accent" />
        Made for peace of mind
      </div>
    </div>
  );
}

export function BrandPanel() {
  return (
    <aside className="flex flex-col overflow-hidden bg-brand px-6 py-6 text-brand-foreground md:px-8 md:py-10 lg:px-14">
      <Link
        to="/login"
        className="flex w-fit items-center gap-3 text-xl font-semibold tracking-tight"
      >
        <ShieldCheck className="size-8 text-brand-accent" aria-hidden="true" />
        SessionForge
      </Link>
      <div className="my-auto hidden pt-16 md:block">
        <p className="text-[10px] font-semibold tracking-[.25em] text-brand-foreground/70">
          YOUR SPACE, SECURED.
        </p>
        <h2 className="my-6 font-serif text-4xl leading-tight tracking-tight lg:text-5xl">
          Good things start
          <br />
          with a little trust.
        </h2>
        <p className="text-sm leading-7 text-brand-foreground/70">
          A simple way in.
          <br />
          Peace of mind, wherever you go.
        </p>
        <TrustIllustration />
      </div>
      <div className="mt-8 hidden justify-between gap-4 border-t border-brand-foreground/15 pt-6 text-xs text-brand-foreground/65 md:flex">
        <span>Less friction. More confidence.</span>
        <span className="hidden text-[10px] tracking-wider lg:block">
          01 — AUTH
        </span>
      </div>
    </aside>
  );
}
