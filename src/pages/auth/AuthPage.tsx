import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../../app/AppProvider";
import { validateReferralCode } from "../../lib/api";
import { getPublicTestimonials } from "../../content/marketplaceContent";
import { t } from "../../content/i18n";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { locale, loginUser, loginWithGoogleUser, registerUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const refCode = searchParams.get("ref") ?? undefined;

  const sellingPoints = [t(locale, "authSellPoint1"), t(locale, "authSellPoint2"), t(locale, "authSellPoint3")];
  const testimonial = getPublicTestimonials(locale)[0];
  const nextHref = useMemo(() => {
    const requested = searchParams.get("next");
    if (!requested || !requested.startsWith(`/${locale}/`)) {
      return `/${locale}/app`;
    }
    return requested;
  }, [locale, searchParams]);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

  useEffect(() => {
    if (!refCode || mode !== "register") return;
    validateReferralCode(locale, refCode)
      .then((data) => setReferrerName(data.referrer_name))
      .catch(() => undefined);
  }, [refCode, locale, mode]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    let cancelled = false;

    async function renderGoogleButton() {
      const clientId = googleClientId;
      if (!clientId) {
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');

      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        document.head.appendChild(script);
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Google Identity Services failed to load"));
        });
      } else if (!window.google) {
        await new Promise<void>((resolve, reject) => {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Google Identity Services failed to load")), { once: true });
        });
      }

      if (cancelled || !window.google || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) return;
          setError(null);
          setIsSubmitting(true);
          try {
            await loginWithGoogleUser(response.credential, refCode);
            navigate(nextHref);
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : t(locale, "unexpectedError"));
          } finally {
            setIsSubmitting(false);
          }
        },
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: mode === "login" ? "signin_with" : "signup_with",
        shape: "pill",
        width: "100%",
      });
    }

    void renderGoogleButton().catch((scriptError) => {
      if (!cancelled) {
        setError(scriptError instanceof Error ? scriptError.message : t(locale, "unexpectedError"));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, locale, loginWithGoogleUser, mode, navigate, nextHref]);

  return (
    <section className="auth-layout">
      <article className="auth-panel auth-panel-pro">
        <div className="auth-shell">
          <aside className="auth-aside auth-aside-pro">
            <p className="eyebrow">{mode === "login" ? t(locale, "signIn") : t(locale, "signUp")}</p>
            <h3>{mode === "login" ? t(locale, "authLoginTitle") : t(locale, "authRegisterTitle")}</h3>
            <p className="support-copy">{t(locale, "authSupportCopy")}</p>
            <ul className="feature-list">
              {sellingPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="hero-trust">
              <span className="status-chip status-chip-success">{locale === "en-CA" ? "Verified profiles" : "Profils verifies"}</span>
              <span className="status-chip">{t(locale, "verifiedProviders")}</span>
              <span className="status-chip">{locale === "en-CA" ? "Local city coverage" : "Couverture locale par ville"}</span>
            </div>
            <article className="auth-quote-card">
              <p>{testimonial.quote}</p>
              <strong>{testimonial.author}</strong>
            </article>
          </aside>

          <section className="panel auth-form-panel auth-form-panel-pro">
            <p className="eyebrow">{mode === "login" ? t(locale, "signIn") : t(locale, "signUp")}</p>
            <h2>{mode === "login" ? t(locale, "loginJobizy") : t(locale, "registerJobizy")}</h2>
            <p className="section-copy">{mode === "login" ? t(locale, "authLoginBody") : t(locale, "authRegisterBody")}</p>
            {referrerName ? (
              <div className="notice notice-success">
                {t(locale, "referredBy")} <strong>{referrerName}</strong>
              </div>
            ) : null}
            {error ? <div className="notice notice-error">{error}</div> : null}
            {googleClientId ? (
              <>
                <div className="google-auth-slot" ref={googleButtonRef} />
                <div className="auth-divider">
                  <span>{locale === "en-CA" ? "or continue with email" : "ou continuer avec email"}</span>
                </div>
              </>
            ) : null}
            <form
              className="form-grid"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                setIsSubmitting(true);
                try {
                  if (mode === "login") {
                    await loginUser(email, password);
                  } else {
                    await registerUser({ email, password, firstName, lastName, refCode });
                  }
                  navigate(nextHref);
                } catch (submitError) {
                  setError(submitError instanceof Error ? submitError.message : t(locale, "unexpectedError"));
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {mode === "register" ? (
                <>
                  <label>
                    <span>{t(locale, "firstName")}</span>
                    <input onChange={(event) => setFirstName(event.target.value)} placeholder={locale === "en-CA" ? "First name" : "Prenom"} required value={firstName} />
                  </label>
                  <label>
                    <span>{t(locale, "lastName")}</span>
                    <input onChange={(event) => setLastName(event.target.value)} placeholder={locale === "en-CA" ? "Last name" : "Nom"} required value={lastName} />
                  </label>
                </>
              ) : null}
              <label className={mode === "login" ? "field-wide" : ""}>
                <span>{t(locale, "email")}</span>
                <input onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required type="email" value={email} />
              </label>
              <label className={mode === "login" ? "field-wide" : ""}>
                <span>{t(locale, "password")}</span>
                <input minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required type="password" value={password} />
              </label>
              <button className="primary-button field-wide" disabled={isSubmitting} type="submit">
                {isSubmitting ? t(locale, "processing") : mode === "login" ? t(locale, "signIn") : t(locale, "signUp")}
              </button>
            </form>
          </section>
        </div>
      </article>
    </section>
  );
}
