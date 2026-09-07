"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const portalHref = (path = "") => `${BASE_PATH}${path}` || "/";

const tools = [
  { path: "/docs", label: "Docs Hub" },
  { path: "/metrics", label: "Metrics" },
  { path: "/playlist", label: "Playlist" },
];

export default function PortalNav() {
  const pathname = usePathname();
  const portalPath = BASE_PATH && pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length) || "/"
    : pathname;

  return (
    <nav className="rr-client-portal-nav" aria-label="REVREBEL client tools">
      <Link className="rr-client-portal-nav__brand" href={portalHref()}>
        <img src={portalHref("/revrebel-logo-white.svg")} alt="REVREBEL" />
        <span>Client Tools</span>
      </Link>

      <div className="rr-client-portal-nav__links">
        {tools.map((tool) => {
          const active = portalPath === tool.path || portalPath.startsWith(`${tool.path}/`);
          return (
            <Link key={tool.path} href={portalHref(tool.path)} data-active={active ? "true" : "false"}>
              {tool.label}
            </Link>
          );
        })}
      </div>

      <div className="rr-client-portal-nav__account">
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl={portalHref()}
          appearance={{
            elements: {
              organizationSwitcherTrigger: { color: "#b2d3de", minHeight: "30px" },
              organizationSwitcherTriggerIcon: { color: "#b2d3de" },
              organizationPreviewMainIdentifier: { color: "#f4fbfd" },
              organizationPreviewSecondaryIdentifier: { color: "#b2d3de" },
            },
          }}
        />
        <UserButton
          userProfileMode="navigation"
          userProfileUrl="https://accounts.revrebel.io/user"
          appearance={{ elements: { avatarBox: { width: "30px", height: "30px" } } }}
        />
      </div>
    </nav>
  );
}
