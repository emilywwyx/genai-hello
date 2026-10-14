"use client";

import { signInWithGoogle } from "@/lib/auth-client";

type GoogleLoginButtonProps = {
  label?: string;
  className?: string;
};

export default function GoogleLoginButton({
  label = "Sign in with Google",
  className = "btn btn-primary",
}: GoogleLoginButtonProps) {
  return (
    <button onClick={signInWithGoogle} className={className}>
      {label}
    </button>
  );
}
