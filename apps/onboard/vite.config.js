import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";

const flattenHtmlOutput = {
  name: "flatten-html-output",
  enforce: "post",
  generateBundle(_options, bundle) {
    for (const asset of Object.values(bundle)) {
      if (
        asset.type === "asset" &&
        asset.fileName.startsWith("src/") &&
        asset.fileName.endsWith(".html")
      ) {
        asset.fileName = asset.fileName.replace(/^src\//, "");
      }
    }
  }
};

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const accessCode = env.VITE_INDEX_ACCESS_CODE || process.env.VITE_INDEX_ACCESS_CODE;
  const apiBaseUrl =
    env.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    env.VITE_API_BASE ||
    process.env.VITE_API_BASE;

  if (!accessCode) {
    console.error("\n[Onboard] BUILD CONFIG ERROR");
    console.error("[Onboard] VITE_INDEX_ACCESS_CODE is not set.");
    console.error("[Onboard] Add VITE_INDEX_ACCESS_CODE to the Webflow Cloud environment variables, then redeploy.\n");
    throw new Error("Missing required environment variable: VITE_INDEX_ACCESS_CODE");
  }

  if (apiBaseUrl) {
    console.log("[Onboard] VITE_API_BASE_URL detected for this build.");
  } else {
    console.warn("[Onboard] VITE_API_BASE_URL is not set; the frontend will fall back to same-origin /api.");
  }

  const frontendEnvAliases = {
    // VITE_API_BASE_URL is the canonical deployment variable. Older frontend
    // modules still read VITE_API_BASE, so map that legacy name at build time.
    "import.meta.env.VITE_API_BASE": JSON.stringify(apiBaseUrl || "")
  };

  if (isSsrBuild) {
    return {
      root: "./",
      define: {
        ...frontendEnvAliases,
        "process.env.VITE_INDEX_ACCESS_CODE": JSON.stringify(accessCode)
      },
      build: {
        rollupOptions: {
          input: resolve(import.meta.dirname, "src/worker.ts")
        }
      }
    };
  }

  return {
    root: ".",
    define: frontendEnvAliases,
    environments: {
      client: {
        build: {
          outDir: "dist/client",
          emptyOutDir: false,
          rollupOptions: {
            input: {
              main: resolve(import.meta.dirname, "index.html"),
              creator: resolve(import.meta.dirname, "src/creator.html"),
              runner: resolve(import.meta.dirname, "src/runner.html"),
              admin: resolve(import.meta.dirname, "src/admin.html"),
              stats: resolve(import.meta.dirname, "src/stats.html")
            }
          }
        }
      }
    },
    plugins: [flattenHtmlOutput]
  };
});
