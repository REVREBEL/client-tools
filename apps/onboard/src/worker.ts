export interface Env {
  ASSETS: Fetcher;
  VITE_INDEX_ACCESS_CODE?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/api/debug")) {
      const fromEnv = env.VITE_INDEX_ACCESS_CODE;
      const fromProcess = typeof process !== "undefined" ? process.env?.VITE_INDEX_ACCESS_CODE : undefined;
      const activeCode = fromEnv || fromProcess;

      return Response.json({
        isConfigured: Boolean(activeCode),
        activeLength: activeCode ? activeCode.length : 0,
        receivedPath: url.pathname
      });
    }

    if (request.method === "POST" && url.pathname.endsWith("/api/verify")) {
      try {
        const { code } = (await request.json()) as { code?: string };
        const expectedCode = env.VITE_INDEX_ACCESS_CODE || (typeof process !== "undefined" ? process.env?.VITE_INDEX_ACCESS_CODE : undefined);
        const isValid = Boolean(expectedCode && code === expectedCode);
        return Response.json({ success: isValid });
      } catch {
        return Response.json({ success: false }, { status: 400 });
      }
    }

    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
