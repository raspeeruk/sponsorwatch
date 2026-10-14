import type { AnchorHTMLAttributes } from "react";

// All public routes are files. Normal navigation also supports the profiles
// rendered after Next's small shell export, without requesting an RSC endpoint.
export default function StaticLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
