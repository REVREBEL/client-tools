const normalizeConfiguredApiBase = (url) => {
  const normalizedPath = url.pathname.replace(/\/$/, "");
  if (!normalizedPath || normalizedPath === "/") {
    url.pathname = "/api";
  }
  return url.toString().replace(/\/$/, "");
};

const resolveApiBase = () => {
  if (window.__API_BASE__) {
    return window.__API_BASE__.replace(/\/$/, "");
  }

  const origin = window.location?.origin;
  const pageHost = window.location?.hostname;
  const configuredApiBase = import.meta.env.VITE_API_BASE;

  if (configuredApiBase) {
    const trimmedApiBase = configuredApiBase.replace(/\/$/, "");
    try {
      const configuredUrl = new URL(trimmedApiBase, origin || undefined);
      const configuredHost = configuredUrl.hostname;
      const isLocalApiHost = ["localhost", "127.0.0.1", "::1"].includes(configuredHost);
      const isLocalPageHost = ["localhost", "127.0.0.1", "::1"].includes(pageHost);

      if (!isLocalApiHost || isLocalPageHost) {
        return normalizeConfiguredApiBase(configuredUrl);
      }
    } catch {
      return trimmedApiBase;
    }
  }

  if (origin && origin !== "null") {
    return `${origin.replace(/\/$/, "")}/api`;
  }

  return "http://127.0.0.1:4010/api";
};

const apiBase = resolveApiBase();
