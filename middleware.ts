import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(undefined, {
  debug: process.env.CLERK_MIDDLEWARE_DEBUG === "true",
});

export const config = {
  // Webflow Cloud only supports Edge middleware. On Next.js 16, keep the
  // legacy middleware.ts convention here instead of proxy.ts because proxy
  // is Node.js-only. middleware.ts defaults to the Edge runtime, so do not
  // set an explicit runtime override.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
