import { useEffect, useState } from "react";
import { authApi, type Session } from "@/auth-api";
import { useAsyncAction } from "./use-async-action";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const { pending, error, run } = useAsyncAction();

  useEffect(() => {
    let active = true;
    authApi
      .listSessions()
      .then((result) => {
        if (active) setSessions(result);
      })
      .catch(() => {
        if (active)
          setLoadError(
            "Could not load sessions. Please reopen your account to try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function update(task: () => Promise<void>, message: string) {
    setNotice("");
    void run(
      async () => {
        await task();
        return authApi.listSessions();
      },
      (result) => {
        setSessions(result);
        setLoadError("");
        setNotice(message);
      },
    );
  }

  function signOut(onSuccess: () => void) {
    setNotice("");
    void run(() => authApi.signOut(), onSuccess);
  }

  return {
    sessions,
    loading,
    pending,
    error: error || loadError,
    notice,
    revoke: (id: string) =>
      update(() => authApi.revokeSession(id), "Device signed out."),
    revokeOthers: () =>
      update(
        () => authApi.revokeOtherSessions(),
        "All other devices signed out.",
      ),
    signOut,
  };
}
