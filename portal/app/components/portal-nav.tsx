"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tools = [
  { href: "/docs", label: "Docs Hub" },
  { href: "/metrics", label: "Metrics" },
  { href: "/playlist", label: "Playlist" },
];

export default function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="rr-client-portal-nav" aria-label="REVREBEL client tools">
      <Link className="rr-client-portal-nav__brand" href="/">
        <img src="/revrebel-logo-white.svg" alt="REVREBEL" />
        <span>Client Tools</span>
      </Link>

      <div className="rr-client-portal-nav__links">
        {tools.map((tool) => {
          const active = pathname === tool.href || pathname.startsWith(`${tool.href}/`);
          return (
            <Link key={tool.href} href={tool.href} data-active={active ? "true" : "false"}>
              {tool.label}
            </Link>
          );
        })}
      </div>

      <div className="rr-client-portal-nav__account">
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/"
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
