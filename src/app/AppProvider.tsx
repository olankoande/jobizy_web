import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  activateProvider,
  addAvailability,
  addProviderService,
  addProviderZone,
  awardQuote,
  cancelMission,
  planMission,
  startMission,
  cancelRequest,
  closeRequest,
  deleteRequest,
  completeMission,
  createQuote,
  createPublicationCheckout,
  createRequest,
  getCategories,
  getMatches,
  getMe,
  getMissions,
  getMyReferralStats,
  getNotificationPreferences,
  getNotifications,
  getVapidPublicKey,
  removePushSubscription,
  savePushSubscription,
  getPlans,
  getPlatformSettings,
  getPublicationPreview,
  getPublicHighlights,
  getProviderProfile,
  getRequests,
  getServices,
  getSubscriptions,
  getZones,
  login,
  loginWithGoogle,
  patchNotificationPreferences,
  patchProviderProfile,
  publishRequest,
  cancelSubscription,
  readAllNotifications,
  register,
  startSubscriptionCheckout,
  updateProfile,
} from "../lib/api";
import { t } from "../content/i18n";
import type {
  Category,
  Locale,
  MatchItem,
  Mission,
  NotificationItem,
  NotificationPreferences,
  Plan,
  PlatformSettings,
  PublicCityHighlight,
  PublicProviderHighlight,
  ProviderProfile,
  ReferralStats,
  RequestItem,
  Service,
  Session,
  Subscription,
  User,
  Zone,
} from "../types";

const SESSION_KEY = "jobizy_web_session";

type AppContextValue = {
  locale: Locale;
  session: Session | null;
  loading: boolean;
  error: string | null;
  notice: string | null;
  platform: PlatformSettings | null;
  categories: Category[];
  services: Service[];
  zones: Zone[];
  publicProviders: PublicProviderHighlight[];
  publicCities: PublicCityHighlight[];
  requests: RequestItem[];
  matches: MatchItem[];
  missions: Mission[];
  notifications: NotificationItem[];
  preferences: NotificationPreferences | null;
  referral: ReferralStats | null;
  plans: Plan[];
  subscriptions: Subscription[];
  providerProfile: ProviderProfile | null;
  currentServiceName: string;
  clearNotice: () => void;
  loginUser: (email: string, password: string) => Promise<void>;
  loginWithGoogleUser: (credential: string, refCode?: string) => Promise<void>;
  registerUser: (form: { email: string; password: string; firstName: string; lastName: string; refCode?: string }) => Promise<void>;
  logout: () => void;
  createClientRequest: (body: Record<string, unknown>) => Promise<{
    requestId: string;
    published: boolean;
    matchesCreated: number;
    publicationTotalCents: number;
    currency: string;
  }>;
  chooseClientQuote: (requestId: string, quoteId: string) => Promise<void>;
  closeClientRequest: (requestId: string) => Promise<void>;
  cancelClientRequest: (requestId: string) => Promise<void>;
  deleteClientRequest: (requestId: string) => Promise<void>;
  publishDraftRequest: (requestId: string) => Promise<void>;
  updateMissionStatus: (missionId: string, action: "plan" | "start" | "complete" | "cancel") => Promise<void>;
  activateProviderRole: () => Promise<void>;
  saveProviderProfile: (body: { display_name: string; business_name: string; description: string; logo_url?: string; cover_url?: string }) => Promise<void>;
  completeProviderSetup: (serviceId: string, zoneId: string) => Promise<void>;
  submitProviderQuote: (requestId: string, data: { message: string; estimated_price_cents?: number | null; proposed_date?: string | null; delay_days?: number | null }) => Promise<void>;
  savePreferences: (body: Partial<NotificationPreferences>) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  saveUserProfile: (firstName: string, lastName: string, phone: string, avatarUrl?: string) => Promise<void>;
  subscribeToPlan: (planId: string) => Promise<void>;
  cancelCurrentSubscription: (subscriptionId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const fallbackAppContext: AppContextValue = {
  locale: "fr-CA",
  session: null,
  loading: false,
  error: null,
  notice: null,
  platform: null,
  categories: [],
  services: [],
  zones: [],
  publicProviders: [],
  publicCities: [],
  requests: [],
  matches: [],
  missions: [],
  notifications: [],
  preferences: null,
  referral: null,
  plans: [],
  subscriptions: [],
  providerProfile: null,
  currentServiceName: "Aucune",
  clearNotice: () => undefined,
  loginUser: async () => undefined,
  loginWithGoogleUser: async () => undefined,
  registerUser: async () => undefined,
  logout: () => undefined,
  createClientRequest: async () => ({
    requestId: "",
    published: false,
    matchesCreated: 0,
    publicationTotalCents: 0,
    currency: "CAD",
  }),
  chooseClientQuote: async () => undefined,
  closeClientRequest: async () => undefined,
  cancelClientRequest: async () => undefined,
  deleteClientRequest: async () => undefined,
  publishDraftRequest: async () => undefined,
  updateMissionStatus: async () => undefined,
  activateProviderRole: async () => undefined,
  saveProviderProfile: async () => undefined,
  completeProviderSetup: async () => undefined,
  submitProviderQuote: async () => undefined,
  savePreferences: async () => undefined,
  markAllNotificationsRead: async () => undefined,
  saveUserProfile: async () => undefined,
  subscribeToPlan: async () => undefined,
  cancelCurrentSubscription: async () => undefined,
  refresh: async () => undefined,
};

const CURRENT_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:3001/api/v1";

function readSession() {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    // Toujours utiliser l'URL du build courant — jamais une URL périmée (localhost, ancienne prod)
    session.apiBaseUrl = CURRENT_API_BASE_URL;
    return session;
  } catch {
    return null;
  }
}

type ProviderProps = {
  locale: Locale;
  children: React.ReactNode;
};

const emptyCollections: {
  platform: PlatformSettings | null;
  categories: Category[];
  services: Service[];
  zones: Zone[];
  publicProviders: PublicProviderHighlight[];
  publicCities: PublicCityHighlight[];
  requests: RequestItem[];
  matches: MatchItem[];
  missions: Mission[];
  notifications: NotificationItem[];
  preferences: NotificationPreferences | null;
  referral: ReferralStats | null;
  plans: Plan[];
  subscriptions: Subscription[];
  providerProfile: ProviderProfile | null;
} = {
  platform: null,
  categories: [] as Category[],
  services: [] as Service[],
  zones: [] as Zone[],
  publicProviders: [] as PublicProviderHighlight[],
  publicCities: [] as PublicCityHighlight[],
  requests: [] as RequestItem[],
  matches: [] as MatchItem[],
  missions: [] as Mission[],
  notifications: [] as NotificationItem[],
  preferences: null as NotificationPreferences | null,
  referral: null as ReferralStats | null,
  plans: [] as Plan[],
  subscriptions: [] as Subscription[],
  providerProfile: null as ProviderProfile | null,
};

function sanitizeList<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value.filter((item): item is T => Boolean(item)) : [];
}

export function AppProvider({ locale, children }: ProviderProps) {
  const [session, setSession] = useState<Session | null>(() => readSession());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [collections, setCollections] = useState(emptyCollections);

  useEffect(() => {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  }, [session]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [platform, categories, services, zones, publicHighlights] = await Promise.all([
        getPlatformSettings(locale),
        getCategories(locale),
        getServices(locale),
        getZones(locale),
        getPublicHighlights(locale),
      ]);

      const nextState = {
        ...emptyCollections,
        platform,
        categories: sanitizeList(categories),
        services: sanitizeList(services),
        zones: sanitizeList(zones),
        publicProviders: sanitizeList(publicHighlights?.providers),
        publicCities: sanitizeList(publicHighlights?.cities),
      };

      if (session) {
        const user = await getMe(session, locale);
        const nextSession = { ...session, user };
        setSession(nextSession);

        const [requests, missions, notifications, preferences, referral, plans, subscriptions] = await Promise.all([
          getRequests(nextSession, locale),
          getMissions(nextSession, locale),
          getNotifications(nextSession, locale),
          getNotificationPreferences(nextSession, locale),
          getMyReferralStats(nextSession, locale).catch(() => null),
          getPlans(nextSession, locale),
          getSubscriptions(nextSession, locale),
        ]);

        nextState.requests = sanitizeList(requests);
        nextState.missions = sanitizeList(missions);
        nextState.notifications = sanitizeList(notifications);
        nextState.preferences = preferences;
        nextState.referral = referral;
        nextState.plans = sanitizeList(plans);
        nextState.subscriptions = sanitizeList(subscriptions);

        if (user.is_provider_enabled) {
          try {
            const providerProfile = await getProviderProfile(nextSession, locale);
            nextState.providerProfile = providerProfile;

            if (providerProfile.provider_status === "active") {
              const matches = await getMatches(nextSession, locale);
              nextState.matches = sanitizeList(matches);
            }
          } catch {
            nextState.providerProfile = null;
          }
        }
      }

      setCollections(nextState);
    } catch (refreshError) {
      const msg = refreshError instanceof Error ? refreshError.message : "";
      const isNetworkError = /networkerror|failed to fetch|load failed/i.test(msg);
      setError(isNetworkError
        ? (locale === "en-CA" ? "Unable to reach the server. Check your connection." : "Impossible de contacter le serveur. Vérifiez votre connexion.")
        : (msg || t(locale, "dataLoadingImpossible")));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [locale, session?.accessToken]);

  async function loginUser(email: string, password: string) {
    const auth = await login({ email, password, locale });
    const provisional: Session = {
      accessToken: auth.data.access_token,
      refreshToken: auth.data.refresh_token,
      expires: auth.data.expires,
      apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:3001/api/v1",
      user: { id: "", email, first_name: "", last_name: "", locale, status: "active", is_client_enabled: true, is_provider_enabled: false },
    };
    const user = await getMe(provisional, locale);
    setSession({ ...provisional, user });
    setNotice(t(locale, "loginSuccess"));
  }

  async function loginWithGoogleUser(credential: string, refCode?: string) {
    const auth = await loginWithGoogle({ credential, locale, ref_code: refCode });
    const provisional: Session = {
      accessToken: auth.data.access_token,
      refreshToken: auth.data.refresh_token,
      expires: auth.data.expires,
      apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:3001/api/v1",
      user: { id: "", email: "", first_name: "", last_name: "", locale, status: "active", is_client_enabled: true, is_provider_enabled: false },
    };
    const user = await getMe(provisional, locale);
    setSession({ ...provisional, user });
    setNotice(t(locale, "loginSuccess"));
  }

  async function registerUser(form: { email: string; password: string; firstName: string; lastName: string; refCode?: string }) {
    const auth = await register({ email: form.email, password: form.password, first_name: form.firstName, last_name: form.lastName, locale, ref_code: form.refCode });
    const provisional: Session = {
      accessToken: auth.data.access_token,
      refreshToken: auth.data.refresh_token,
      expires: auth.data.expires,
      apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:3001/api/v1",
      user: { id: "", email: form.email, first_name: form.firstName, last_name: form.lastName, locale, status: "active", is_client_enabled: true, is_provider_enabled: false },
    };
    const user = await getMe(provisional, locale);
    setSession({ ...provisional, user });
    setNotice(t(locale, "accountCreated"));
  }

  function logout() {
    setSession(null);
    setCollections(emptyCollections);
    setNotice(null);
    setError(null);
  }

  async function createClientRequest(body: Record<string, unknown>) {
    if (!session) {
      return {
        requestId: "",
        published: false,
        matchesCreated: 0,
        publicationTotalCents: 0,
        currency: collections.platform?.currency ?? "CAD",
      };
    }

    const created = await createRequest(session, locale, body);

    // The backend may have already published the request during creation (free flow).
    // In that case, skip the publish step entirely to avoid a double-publish error.
    if ((created as any).status === "published") {
      setNotice(t(locale, "requestCreatedPublished"));
      await refresh();
      return {
        requestId: created.id,
        published: true,
        matchesCreated: 0,
        publicationTotalCents: 0,
        currency: collections.platform?.currency ?? "CAD",
      };
    }

    const preview = await getPublicationPreview(session, locale, created.id);

    if (preview.publication_payment_required && preview.publication_total_cents > 0) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const checkout = await createPublicationCheckout(session, locale, created.id, {
        success_url: `${origin}/${locale}/app/demandes?publication_payment=success&request_id=${created.id}`,
        cancel_url: `${origin}/${locale}/app/demandes?publication_payment=cancelled`,
      });
      window.location.href = checkout.checkout_url;
      return {
        requestId: created.id,
        published: false,
        matchesCreated: 0,
        publicationTotalCents: preview.publication_total_cents,
        currency: preview.currency,
      };
    }

    const publication = await publishRequest(session, locale, created.id);
    setNotice(t(locale, "requestCreatedPublished"));
    await refresh();
    return {
      requestId: created.id,
      published: true,
      matchesCreated: publication.matches_created,
      publicationTotalCents: preview.publication_total_cents,
      currency: preview.currency,
    };
  }

  async function closeClientRequest(requestId: string) {
    if (!session) return;
    await closeRequest(session, locale, requestId);
    setNotice(t(locale, "requestClosed"));
    await refresh();
  }

  async function cancelClientRequest(requestId: string) {
    if (!session) return;
    await cancelRequest(session, locale, requestId);
    setNotice(locale === "en-CA" ? "Request cancelled." : "Demande annulée.");
    await refresh();
  }

  async function deleteClientRequest(requestId: string) {
    if (!session) return;
    await deleteRequest(session, locale, requestId);
    setNotice(locale === "en-CA" ? "Draft deleted." : "Brouillon supprimé.");
    await refresh();
  }

  async function publishDraftRequest(requestId: string) {
    if (!session) return;
    const preview = await getPublicationPreview(session, locale, requestId);
    if (preview.publication_payment_required && preview.publication_total_cents > 0) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const checkout = await createPublicationCheckout(session, locale, requestId, {
        success_url: `${origin}/${locale}/app/demandes?publication_payment=success&request_id=${requestId}`,
        cancel_url: `${origin}/${locale}/app/demandes?publication_payment=cancelled`,
      });
      window.location.href = checkout.checkout_url;
      return;
    }
    await publishRequest(session, locale, requestId);
    setNotice(locale === "en-CA" ? "Request published." : "Demande publiée.");
    await refresh();
  }

  async function chooseClientQuote(requestId: string, quoteId: string) {
    if (!session) return;
    await awardQuote(session, locale, requestId, quoteId);
    setNotice(locale === "en-CA" ? "Quote selected and mission created" : "Offre selectionnee et mission creee");
    await refresh();
  }

  async function updateMissionStatus(missionId: string, action: "plan" | "start" | "complete" | "cancel") {
    if (!session) return;
    if (action === "plan") await planMission(session, locale, missionId);
    else if (action === "start") await startMission(session, locale, missionId);
    else if (action === "complete") await completeMission(session, locale, missionId);
    else await cancelMission(session, locale, missionId);
    const notices: Record<string, string> = {
      plan: locale === "en-CA" ? "Mission scheduled" : "Mission planifiee",
      start: locale === "en-CA" ? "Mission started" : "Mission demarree",
      complete: t(locale, "missionCompleted"),
      cancel: t(locale, "missionCancelled"),
    };
    setNotice(notices[action]);
    await refresh();
  }

  async function activateProviderRole() {
    if (!session) return;
    await activateProvider(session, locale);
    const user = await getMe(session, locale);
    setSession({ ...session, user });
    setNotice(t(locale, "providerRoleActivated"));
    await refresh();
  }

  async function saveProviderProfile(body: { display_name: string; business_name: string; description: string; logo_url?: string; cover_url?: string }) {
    if (!session) return;
    await patchProviderProfile(session, locale, body);
    setNotice(t(locale, "providerProfileSaved"));
    await refresh();
  }

  async function completeProviderSetup(serviceId: string, zoneId: string) {
    if (!session) return;
    await addProviderService(session, locale, serviceId);
    await addProviderZone(session, locale, zoneId);
    await addAvailability(session, locale, { weekday: 1, start_time: "08:00:00", end_time: "17:00:00", is_active: true });
    setNotice(t(locale, "providerOnboardingComplete"));
    await refresh();
  }

  async function submitProviderQuote(requestId: string, data: { message: string; estimated_price_cents?: number | null; proposed_date?: string | null; delay_days?: number | null }) {
    if (!session) return;
    await createQuote(session, locale, { request_id: requestId, ...data });
    setNotice(t(locale, "quoteSent"));
    await refresh();
  }

  async function managePushSubscription(enabled: boolean) {
    if (!session) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;

      if (enabled) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const vapidPublicKey = await getVapidPublicKey(session, locale).catch(() => null);
        if (!vapidPublicKey) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });

        const raw = subscription.toJSON();
        if (raw.endpoint && raw.keys?.p256dh && raw.keys?.auth) {
          await savePushSubscription(session, locale, {
            endpoint: raw.endpoint,
            keys: { p256dh: raw.keys.p256dh, auth: raw.keys.auth },
          });
        }
      } else {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await removePushSubscription(session, locale, subscription.endpoint).catch(() => undefined);
          await subscription.unsubscribe();
        }
      }
    } catch {
      // Push subscription errors are non-fatal
    }
  }

  async function savePreferences(body: Partial<NotificationPreferences>) {
    if (!session || !collections.preferences) return;
    if (body.push_enabled !== undefined) {
      await managePushSubscription(Boolean(body.push_enabled));
    }
    await patchNotificationPreferences(session, locale, collections.preferences.id, body);
    setNotice(t(locale, "preferencesUpdated"));
    await refresh();
  }

  async function markAllNotificationsRead() {
    if (!session) return;
    await readAllNotifications(session, locale);
    await refresh();
  }

  async function saveUserProfile(firstName: string, lastName: string, phone: string, avatarUrl?: string) {
    if (!session) return;
    const body: Partial<User> = { first_name: firstName, last_name: lastName, phone };
    if (avatarUrl !== undefined) body.avatar_url = avatarUrl || null;
    const user = await updateProfile(session, locale, body);
    setSession({ ...session, user });
    setNotice(t(locale, "userProfileSaved"));
    await refresh();
  }

  async function subscribeToPlan(planId: string) {
    if (!session) {
      setError(locale === "en-CA" ? "You must be signed in to subscribe." : "Vous devez etre connecte pour souscrire.");
      return;
    }

    setError(null);
    try {
      const origin = window.location.origin;
      const result = await startSubscriptionCheckout(session, locale, planId, {
        success_url: `${origin}/${locale}/pro/abonnement?checkout=success`,
        cancel_url: `${origin}/${locale}/pro/abonnement?checkout=cancelled`,
      });
      if (result?.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }
      setNotice(t(locale, "subscriptionActive"));
      await refresh();
    } catch (subscriptionError) {
      setError(subscriptionError instanceof Error ? subscriptionError.message : t(locale, "unexpectedError"));
    }
  }

  async function cancelCurrentSubscription(subscriptionId: string) {
    if (!session) {
      setError(locale === "en-CA" ? "You must be signed in to manage subscriptions." : "Vous devez etre connecte pour gerer les abonnements.");
      return;
    }

    setError(null);
    try {
      await cancelSubscription(session, locale, subscriptionId);
      setNotice(t(locale, "subscriptionCancellation"));
      await refresh();
    } catch (subscriptionError) {
      setError(subscriptionError instanceof Error ? subscriptionError.message : t(locale, "unexpectedError"));
    }
  }

  const currentServiceName = useMemo(() => {
    const request = collections.requests[0];
    if (!request) return "Aucune";
    return collections.services.find((service) => service.id === request.service_id)?.name ?? "Aucune";
  }, [collections.requests, collections.services]);

  const value = useMemo<AppContextValue>(() => ({
    locale,
    session,
    loading,
    error,
    notice,
    currentServiceName,
    clearNotice: () => setNotice(null),
    loginUser,
    loginWithGoogleUser,
    registerUser,
    logout,
    createClientRequest,
    chooseClientQuote,
    closeClientRequest,
    cancelClientRequest,
    deleteClientRequest,
    publishDraftRequest,
    updateMissionStatus,
    activateProviderRole,
    saveProviderProfile,
    completeProviderSetup,
    submitProviderQuote,
    savePreferences,
    markAllNotificationsRead,
    saveUserProfile,
    subscribeToPlan,
    cancelCurrentSubscription,
    refresh,
    ...collections,
  }), [locale, session, loading, error, notice, currentServiceName, collections]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    return fallbackAppContext;
  }
  return context;
}
