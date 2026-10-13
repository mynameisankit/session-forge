import { redirect, type RouteObject } from "react-router";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RouteError } from "@/components/auth/route-error";
import { AccountPage } from "@/pages/account-page";
import { ChangePasswordPage } from "@/pages/change-password-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { LoginPage } from "@/pages/login-page";
import { PasswordUpdatedPage } from "@/pages/password-updated-page";
import { RegisterPage } from "@/pages/register-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { ResetSentPage } from "@/pages/reset-sent-page";
import { accountAction, accountLoader } from "@/routes/account";
import { requireUser } from "@/routes/authentication";
import { loginAction } from "@/routes/login";
import { registerAction } from "@/routes/register";
import { changePasswordAction, forgotPasswordAction, resendResetAction, resetPasswordAction } from "@/routes/password";

export const appRoutes: RouteObject[] = [{
  Component: AuthLayout,
  ErrorBoundary: () => <AuthLayout><RouteError /></AuthLayout>,
  HydrateFallback: () => <AuthLayout><p role="status">Loading your account…</p></AuthLayout>,
  children: [
    { index: true, loader: () => redirect("/login") },
    { path: "login", Component: LoginPage, action: loginAction },
    { path: "register", Component: RegisterPage, action: registerAction },
    { path: "forgot", Component: ForgotPasswordPage, action: forgotPasswordAction },
    { path: "reset-sent", Component: ResetSentPage, action: resendResetAction },
    { path: "reset", Component: ResetPasswordPage, action: resetPasswordAction },
    { path: "reset-done", Component: PasswordUpdatedPage },
    { path: "account", Component: AccountPage, loader: accountLoader, action: accountAction },
    { path: "change-password", Component: ChangePasswordPage, loader: requireUser, action: changePasswordAction },
    { path: "*", loader: () => redirect("/login") },
  ],
}];
