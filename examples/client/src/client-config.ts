const authMode = import.meta.env.VITE_AUTH_MODE || "mock";

if (authMode !== "mock" && authMode !== "http") {
  throw new Error('VITE_AUTH_MODE must be "mock" or "http".');
}

export const clientConfig = {
  mock: authMode === "mock",
  exampleName: import.meta.env.VITE_EXAMPLE_NAME || "SessionForge example",
};
