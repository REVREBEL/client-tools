import { notFound } from "next/navigation";
import {
  ClerkSurfacePreview,
  clerkPreviewSurfaces,
  type ClerkPreviewSurface,
} from "@/components/clerk-preview/ClerkSurfacePreview";

export const dynamicParams = false;

export function generateStaticParams() {
  return clerkPreviewSurfaces.map((surface) => ({ surface }));
}

export default async function ClerkPreviewSurfacePage({
  params,
}: {
  params: Promise<{ surface: string }>;
}) {
  const { surface } = await params;

  if (!clerkPreviewSurfaces.includes(surface as ClerkPreviewSurface)) {
    notFound();
  }

  return <ClerkSurfacePreview surface={surface as ClerkPreviewSurface} />;
}
