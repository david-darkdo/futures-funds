import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "553292446781-phmi1pmmud76jm09f8l0lm5p0a8vbvns.apps.googleusercontent.com";

export function GoogleSignInButton({ label }: { label?: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [gisRendered, setGisRendered] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let intervalId: any;

    const initGis = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) {
              toast.error("Google authentication failed: missing token.");
              return;
            }
            setLoading(true);
            try {
              const { error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: response.credential,
              });
              if (error) {
                console.error("[Google Auth] signInWithIdToken error:", error);
                toast.error(error.message || "Failed to sign in with Google.");
              } else {
                toast.success("Signed in successfully with Google!");
                window.location.href = "/dashboard";
              }
            } catch (err: any) {
              console.error("[Google Auth] Exception:", err);
              toast.error(err?.message || "An unexpected error occurred.");
            } finally {
              setLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: Math.min(googleBtnRef.current.offsetWidth || 380, 400),
          });
          setGisRendered(true);
        }
        return true;
      } catch (err) {
        console.warn("[Google Auth] Error initializing GIS:", err);
        return false;
      }
    };

    if (!initGis()) {
      intervalId = setInterval(() => {
        if (initGis()) {
          clearInterval(intervalId);
        }
      }, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleFallbackOAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        setLoading(false);
        toast.error(error.message || "Google sign-in failed");
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err?.message || "Google sign-in failed");
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Container for Google Identity Services official rendered button */}
      <div
        ref={googleBtnRef}
        className={`w-full flex justify-center ${gisRendered ? "min-h-[44px]" : "hidden"}`}
        style={{ minHeight: gisRendered ? "44px" : "0px" }}
      />

      {/* Fallback button if GIS script is loading or blocked */}
      {!gisRendered && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full h-12 gap-3"
          onClick={handleFallbackOAuth}
          disabled={loading}
        >
          <GoogleIcon />
          <span>{label || t("auth.continueWithGoogle")}</span>
        </Button>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
