import { httpAuthApi } from "./api/http-auth-api";
import { mockAuthApi } from "./api/mock-auth-api";
import { clientConfig } from "./client-config";

export type { AuthApi, User, Session } from "./api/types";
export const authApi = clientConfig.mock ? mockAuthApi : httpAuthApi;
