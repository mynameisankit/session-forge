import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { authApi, type User } from "@/auth-api";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AccountPage } from "@/pages/account-page";
import { ChangePasswordPage } from "@/pages/change-password-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { LoginPage } from "@/pages/login-page";
import { PasswordUpdatedPage } from "@/pages/password-updated-page";
import { RegisterPage } from "@/pages/register-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { ResetSentPage } from "@/pages/reset-sent-page";
import { SignedOutPage } from "@/pages/signed-out-page";

export function App() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [restoring, setRestoring] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let active = true;
    authApi
      .getCurrentUser()
      .then((result) => {
        if (active) {
          setUser(result);
          if (result) setEmail(result.email);
        }
      })
      .catch((error) => {
        if (active)
          setSessionError(
            error instanceof Error
              ? error.message
              : "Could not restore your session.",
          );
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function onAuthenticated(result: User) {
    setSessionError("");
    setUser(result);
    setEmail(result.email);
    navigate("/account");
  }

  function onSignedOut() {
    setUser(null);
    navigate("/login");
  }

  function onResetRequested(address: string) {
    setEmail(address);
    navigate("/reset-sent");
  }

  return (
    <Routes>
      <Route
        element={<AuthLayout loading={restoring} sessionError={sessionError} />}
      >
        <Route index element={<Navigate to="/login" replace />} />
        <Route
          path="login"
          element={
            <LoginPage email={email} onAuthenticated={onAuthenticated} />
          }
        />
        <Route
          path="register"
          element={
            <RegisterPage email={email} onAuthenticated={onAuthenticated} />
          }
        />
        <Route
          path="forgot"
          element={
            <ForgotPasswordPage email={email} onRequested={onResetRequested} />
          }
        />
        <Route path="reset-sent" element={<ResetSentPage email={email} />} />
        <Route path="reset" element={<ResetPasswordPage />} />
        <Route path="reset-done" element={<PasswordUpdatedPage />} />
        <Route
          path="account"
          element={
            user ? (
              <AccountPage user={user} onSignedOut={onSignedOut} />
            ) : (
              <SignedOutPage />
            )
          }
        />
        <Route
          path="change-password"
          element={user ? <ChangePasswordPage /> : <SignedOutPage />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
}
