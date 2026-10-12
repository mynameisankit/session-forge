/** Display labels for the demo screen explorer and page titles. Routes live in App.tsx. */
export const screens = {
  "/login": "Sign in",
  "/register": "Create account",
  "/forgot": "Forgot password",
  "/reset-sent": "Check your inbox",
  "/reset": "Set a new password",
  "/reset-done": "Password updated",
  "/account": "Your account",
  "/change-password": "Change password",
};

export type Screen = keyof typeof screens;
