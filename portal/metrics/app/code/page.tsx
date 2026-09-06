import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import CodeCanvas from "./code-canvas-client";
import {
  CODE_EDITOR_PERMISSION,
  CODE_EDITOR_PERMISSION_UNSCOPED,
} from "../permissions";

export const dynamic = "force-dynamic";

export default async function CodeCanvasPage() {
  const { isAuthenticated, has } = await auth();
  const canUseCodeCanvas =
    has({ permission: CODE_EDITOR_PERMISSION }) ||
    has({ permission: CODE_EDITOR_PERMISSION_UNSCOPED });

  if (!isAuthenticated || !canUseCodeCanvas) {
    notFound();
  }

  return <CodeCanvas />;
}
