import { Check, LockKeyhole, Mail } from "lucide-react";
import type { ReactNode } from "react";

const icons = { lock: LockKeyhole, mail: Mail, check: Check };

type AuthHeadingProps = {
  title: string;
  children: ReactNode;
  icon?: keyof typeof icons;
};

export function AuthHeading({
  title,
  children,
  icon = "lock",
}: AuthHeadingProps) {
  const Icon = icons[icon];
  return (
    <div className="mb-8">
      <div className="mb-6 grid size-12 place-items-center rounded-xl border bg-secondary text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h1
        tabIndex={-1}
        className="mb-3 text-3xl font-semibold tracking-tight outline-none"
      >
        {title}
      </h1>
      <p className="text-sm leading-7 text-muted-foreground wrap-anywhere">
        {children}
      </p>
    </div>
  );
}
