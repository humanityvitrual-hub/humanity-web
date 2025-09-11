import React from "react";
import Link from "next/link";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asLink?: boolean;
  href?: string;
  variant?: "primary" | "ghost";
};

export default function Button({
  asLink,
  href,
  variant = "primary",
  className,
  children,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500";

  const styles = {
    primary: "bg-pink-600 hover:bg-pink-500 text-white",
    ghost: "bg-transparent hover:bg-white/10 text-white",
  }[variant];

  const classes = clsx(base, styles, className);

  if (asLink && href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
