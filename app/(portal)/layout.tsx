import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PortalNav from "../components/portal-nav";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="rr-client-portal">
      <PortalNav />
      <div className="rr-client-portal-main">{children}</div>
    </div>
  );
}
