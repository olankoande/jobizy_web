import type {
  ApiEnvelope,
  Availability,
  Category,
  Locale,
  MatchItem,
  MatchingRequest,
  Message,
  Mission,
  NotificationItem,
  NotificationPreferences,
  Plan,
  PlatformSettings,
  PublicCityHighlight,
  PublicProviderHighlight,
  PortfolioItem,
  ProviderProfile,
  ProviderQuote,
  PublicationPreview,
  Quote,
  ReferralStats,
  Review,
  RequestItem,
  Service,
  Session,
  Subscription,
  User,
  Zone,
  Conversation,
  Dispute,
  DisputeMessage,
  ProviderAnalytics,
} from "../types";

export class ApiResponseError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  constructor(httpStatus: number, code: string, message: string) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

const DEFAULT_API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:3001/api/v1";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  locale?: Locale;
  query?: Record<string, string | number | boolean | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"], apiBaseUrl = DEFAULT_API_BASE_URL) {
  const baseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  const cleanPath = path.replace(/^\/+/, "");
  const url = new URL(cleanPath, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function apiRequest<T>(path: string, options: RequestOptions = {}, apiBaseUrl = DEFAULT_API_BASE_URL) {
  const url = buildUrl(path, options.query, apiBaseUrl);
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.locale ? { "Accept-Language": options.locale } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = text
    ? (() => {
        if (!isJson) return null;
        try {
          return JSON.parse(text) as ApiEnvelope<T> & { error?: { message?: string; code?: string } };
        } catch {
          return null;
        }
      })()
    : null;

  if (!response.ok) {
    const fallback =
      !isJson && text
        ? `Endpoint ${url} a renvoye ${contentType || "un contenu non JSON"}`
        : `Request failed (${response.status})`;
    throw new ApiResponseError(
      response.status,
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? payload?.error?.code ?? fallback,
    );
  }

  if (!payload) {
    throw new Error(`Endpoint ${url} n'a pas renvoye de JSON valide.`);
  }

  return payload;
}

function withSession(session: Session | null, locale: Locale) {
  return {
    token: session?.accessToken,
    locale,
    apiBaseUrl: session?.apiBaseUrl ?? DEFAULT_API_BASE_URL,
  };
}

export async function login(params: { email: string; password: string; locale: Locale; apiBaseUrl?: string }) {
  return apiRequest<{ access_token: string; refresh_token: string; expires: number }>(
    "/auth/login",
    { method: "POST", body: { email: params.email, password: params.password }, locale: params.locale },
    params.apiBaseUrl ?? DEFAULT_API_BASE_URL,
  );
}

export async function loginWithGoogle(params: { credential: string; locale: Locale; ref_code?: string; apiBaseUrl?: string }) {
  return apiRequest<{ access_token: string; refresh_token: string; expires: number }>(
    "/auth/google",
    { method: "POST", body: { credential: params.credential, locale: params.locale, ref_code: params.ref_code }, locale: params.locale },
    params.apiBaseUrl ?? DEFAULT_API_BASE_URL,
  );
}

export async function register(params: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  locale: Locale;
  ref_code?: string;
  apiBaseUrl?: string;
}) {
  return apiRequest<{ access_token: string; refresh_token: string; expires: number }>(
    "/auth/register",
    { method: "POST", body: params, locale: params.locale },
    params.apiBaseUrl ?? DEFAULT_API_BASE_URL,
  );
}

export async function getMe(session: Session | null, locale: Locale) {
  return apiRequest<User>("/users/me", withSession(session, locale), session?.apiBaseUrl).then((response) => response.data);
}

export async function updateProfile(session: Session, locale: Locale, body: Partial<User>) {
  return apiRequest<User>("/users/me", { ...withSession(session, locale), method: "PATCH", body }, session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function getPlatformSettings(locale: Locale) {
  return apiRequest<PlatformSettings>("/jobizy/platform-settings", { locale }).then((response) => response.data);
}

export async function getCategories(locale: Locale) {
  return apiRequest<Category[]>("/categories", { locale }).then((response) => response.data);
}

export async function getServices(locale: Locale, categoryId?: string) {
  return apiRequest<Service[]>("/services", { locale, query: { category_id: categoryId } }).then(
    (response) => response.data,
  );
}

export async function getZones(locale: Locale, search?: string) {
  return apiRequest<Zone[]>("/zones", { locale, query: { search } }).then((response) => response.data);
}

export async function getPublicHighlights(locale: Locale) {
  return apiRequest<{ providers: PublicProviderHighlight[]; cities: PublicCityHighlight[] }>("/jobizy/public-highlights", { locale }).then(
    (response) => response.data,
  );
}

export async function activateProvider(session: Session, locale: Locale) {
  return apiRequest<{ provider_profile_id: string; provider_status: string }>(
    "/providers/activate",
    { ...withSession(session, locale), method: "POST", body: {} },
    session.apiBaseUrl,
  ).then((response) => response.data);
}

export async function getProviderProfile(session: Session, locale: Locale) {
  return apiRequest<ProviderProfile>("/provider-profiles/me", withSession(session, locale), session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function patchProviderProfile(session: Session, locale: Locale, body: Partial<ProviderProfile>) {
  return apiRequest<ProviderProfile>(
    "/provider-profiles/me",
    { ...withSession(session, locale), method: "PATCH", body },
    session.apiBaseUrl,
  ).then((response) => response.data);
}

export async function getProviderServices(session: Session, locale: Locale) {
  return apiRequest<{ id: string; provider_profile_id: string; service_id: string; service_name: string; status: string; created_at: string }[]>(
    "/provider-profiles/me/services",
    withSession(session, locale),
    session.apiBaseUrl,
  ).then((response) => response.data);
}

export async function addProviderService(session: Session, locale: Locale, serviceId: string) {
  return apiRequest("/provider-profiles/me/services", {
    ...withSession(session, locale),
    method: "POST",
    body: { service_id: serviceId },
  }, session.apiBaseUrl);
}

export async function removeProviderService(session: Session, locale: Locale, providerServiceId: string) {
  return apiRequest<{ deleted: boolean }>(`/provider-profiles/me/services/${providerServiceId}`, {
    ...withSession(session, locale),
    method: "DELETE",
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getProviderZones(session: Session, locale: Locale) {
  return apiRequest<{ id: string; provider_profile_id: string; zone_id: string; zone_name: string; coverage_type: string; created_at: string }[]>(
    "/provider-profiles/me/zones",
    withSession(session, locale),
    session.apiBaseUrl,
  ).then((response) => response.data);
}

export async function addProviderZone(session: Session, locale: Locale, zoneId: string) {
  return apiRequest("/provider-profiles/me/zones", {
    ...withSession(session, locale),
    method: "POST",
    body: { zone_id: zoneId, coverage_type: "standard" },
  }, session.apiBaseUrl);
}

export async function removeProviderZone(session: Session, locale: Locale, providerZoneId: string) {
  return apiRequest<{ deleted: boolean }>(`/provider-profiles/me/zones/${providerZoneId}`, {
    ...withSession(session, locale),
    method: "DELETE",
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function activateProviderProfileStatus(session: Session, locale: Locale) {
  return apiRequest<ProviderProfile>("/provider-profiles/me/activate", {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getMatchingRequests(session: Session, locale: Locale) {
  return apiRequest<MatchingRequest[]>(
    "/provider-profiles/me/matching-requests",
    withSession(session, locale),
    session.apiBaseUrl,
  ).then((response) => response.data);
}

export async function getAvailabilities(session: Session, locale: Locale) {
  return apiRequest<Availability[]>("/provider-profiles/me/availabilities", withSession(session, locale), session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function addAvailability(session: Session, locale: Locale, body: Omit<Availability, "id" | "provider_profile_id">) {
  return apiRequest<Availability>("/provider-profiles/me/availabilities", {
    ...withSession(session, locale),
    method: "POST",
    body,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function patchAvailability(session: Session, locale: Locale, availabilityId: string, body: Partial<Omit<Availability, "id" | "provider_profile_id">>) {
  return apiRequest<Availability>(`/availabilities/${availabilityId}`, {
    ...withSession(session, locale),
    method: "PATCH",
    body,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function deleteAvailability(session: Session, locale: Locale, availabilityId: string) {
  return apiRequest<{ deleted: boolean }>(`/availabilities/${availabilityId}`, {
    ...withSession(session, locale),
    method: "DELETE",
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getRequests(session: Session, locale: Locale) {
  return apiRequest<RequestItem[]>("/requests", withSession(session, locale), session.apiBaseUrl).then((response) => response.data);
}

export async function createRequest(session: Session, locale: Locale, body: Record<string, unknown>) {
  return apiRequest<{ id: string; status: string }>("/requests", {
    ...withSession(session, locale),
    method: "POST",
    body,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function updateRequest(session: Session, locale: Locale, requestId: string, body: Record<string, unknown>) {
  return apiRequest<RequestItem>(`/requests/${requestId}`, {
    ...withSession(session, locale),
    method: "PATCH",
    body,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function deleteRequest(session: Session, locale: Locale, requestId: string) {
  return apiRequest<{ deleted: boolean }>(`/requests/${requestId}`, {
    ...withSession(session, locale),
    method: "DELETE",
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getPublicationPreview(session: Session, locale: Locale, requestId: string) {
  return apiRequest<PublicationPreview>(`/requests/${requestId}/publication-preview`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function createPublicationCheckout(
  session: Session,
  locale: Locale,
  requestId: string,
  urls: { success_url: string; cancel_url: string },
) {
  return apiRequest<{ checkout_url: string }>(
    `/requests/${requestId}/publication-checkout`,
    { ...withSession(session, locale), method: "POST", body: urls },
    session.apiBaseUrl,
  ).then((response) => response.data);
}

export async function publishRequest(session: Session, locale: Locale, requestId: string) {
  return apiRequest<{ request: RequestItem; matches_created: number; already_published: boolean }>(
    `/requests/${requestId}/publish`,
    { ...withSession(session, locale), method: "POST", body: {} },
    session.apiBaseUrl,
  ).then((response) => response.data);
}

export async function confirmPublicationPayment(session: Session, locale: Locale, requestId: string) {
  return apiRequest<{ request: RequestItem; matches_created: number; already_published: boolean; status?: string }>(
    `/requests/${requestId}/confirm-publication-payment`,
    { ...withSession(session, locale), method: "POST", body: {} },
    session.apiBaseUrl,
  ).then((response) => response.data);
}

export async function closeRequest(session: Session, locale: Locale, requestId: string) {
  return apiRequest<RequestItem>(`/requests/${requestId}/close`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function cancelRequest(session: Session, locale: Locale, requestId: string) {
  return apiRequest<RequestItem>(`/requests/${requestId}/cancel`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getMatches(session: Session, locale: Locale) {
  return apiRequest<MatchItem[]>("/matches", withSession(session, locale), session.apiBaseUrl).then((response) => response.data);
}

export async function createQuote(session: Session, locale: Locale, body: {
  request_id: string;
  message: string;
  estimated_price_cents?: number | null;
  proposed_date?: string | null;
  proposed_time_window?: string | null;
  delay_days?: number | null;
}) {
  return apiRequest<Quote>("/quotes", { ...withSession(session, locale), method: "POST", body }, session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function getQuotes(session: Session, locale: Locale, requestId: string) {
  return apiRequest<Quote[]>("/quotes", {
    ...withSession(session, locale),
    query: { request_id: requestId },
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getPortfolio(session: Session, locale: Locale) {
  return apiRequest<PortfolioItem[]>("/provider-profiles/me/portfolio", withSession(session, locale), session.apiBaseUrl).then((r) => r.data);
}

export async function getPublicPortfolio(profileId: string, locale: Locale) {
  return apiRequest<PortfolioItem[]>(`/provider-profiles/${profileId}/portfolio`, { locale }).then((r) => r.data);
}

export async function createPortfolioItem(session: Session, locale: Locale, body: { title: string; description?: string | null; image_url?: string | null; sort_order?: number }) {
  return apiRequest<PortfolioItem>("/provider-profiles/me/portfolio", { ...withSession(session, locale), method: "POST", body }, session.apiBaseUrl).then((r) => r.data);
}

export async function updatePortfolioItem(session: Session, locale: Locale, id: string, body: Partial<{ title: string; description: string | null; image_url: string | null; sort_order: number }>) {
  return apiRequest<PortfolioItem>(`/provider-profiles/me/portfolio/${id}`, { ...withSession(session, locale), method: "PATCH", body }, session.apiBaseUrl).then((r) => r.data);
}

export async function deletePortfolioItem(session: Session, locale: Locale, id: string) {
  return apiRequest<{ deleted: boolean }>(`/provider-profiles/me/portfolio/${id}`, { ...withSession(session, locale), method: "DELETE" }, session.apiBaseUrl).then((r) => r.data);
}

export async function getProviderQuotes(session: Session, locale: Locale) {
  return apiRequest<ProviderQuote[]>("/provider/quotes", {
    ...withSession(session, locale),
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function withdrawQuote(session: Session, locale: Locale, quoteId: string) {
  return apiRequest<ProviderQuote>(`/quotes/${quoteId}/withdraw`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function rejectQuote(session: Session, locale: Locale, quoteId: string) {
  return apiRequest<Quote>(`/quotes/${quoteId}/reject`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function awardQuote(session: Session, locale: Locale, requestId: string, quoteId: string) {
  return apiRequest<Mission>(`/requests/${requestId}/award`, {
    ...withSession(session, locale),
    method: "POST",
    body: { quote_id: quoteId },
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getMissions(session: Session, locale: Locale) {
  return apiRequest<Mission[]>("/missions", withSession(session, locale), session.apiBaseUrl).then((response) => response.data);
}

export async function completeMission(session: Session, locale: Locale, missionId: string) {
  return apiRequest<Mission>(`/missions/${missionId}/complete`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function planMission(session: Session, locale: Locale, missionId: string) {
  return apiRequest<Mission>(`/missions/${missionId}/plan`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function startMission(session: Session, locale: Locale, missionId: string) {
  return apiRequest<Mission>(`/missions/${missionId}/start`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function cancelMission(session: Session, locale: Locale, missionId: string) {
  return apiRequest<Mission>(`/missions/${missionId}/cancel`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getNotifications(session: Session, locale: Locale) {
  return apiRequest<NotificationItem[]>("/notifications", withSession(session, locale), session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function getConversations(session: Session, locale: Locale) {
  return apiRequest<Conversation[]>("/conversations", withSession(session, locale), session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function getConversationMessages(session: Session, locale: Locale, conversationId: string) {
  return apiRequest<Message[]>(`/conversations/${conversationId}/messages`, withSession(session, locale), session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function sendConversationMessage(
  session: Session,
  locale: Locale,
  conversationId: string,
  body: { body: string; message_type?: "text" | "attachment" | "system"; attachment_url?: string | null },
) {
  return apiRequest<Message>(`/conversations/${conversationId}/messages`, {
    ...withSession(session, locale),
    method: "POST",
    body,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function markMessageRead(session: Session, locale: Locale, messageId: string) {
  return apiRequest<Message>(`/messages/${messageId}`, {
    ...withSession(session, locale),
    method: "PATCH",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function readAllNotifications(session: Session, locale: Locale) {
  return apiRequest<{ updated: number }>("/notifications/read-all", {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getNotificationPreferences(session: Session, locale: Locale) {
  return apiRequest<NotificationPreferences>("/notification-preferences", withSession(session, locale), session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function patchNotificationPreferences(
  session: Session,
  locale: Locale,
  preferenceId: string,
  body: Partial<NotificationPreferences>,
) {
  return apiRequest<NotificationPreferences>(`/notification-preferences/${preferenceId}`, {
    ...withSession(session, locale),
    method: "PATCH",
    body,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getVapidPublicKey(session: Session, locale: Locale) {
  return apiRequest<{ public_key: string }>("/push/vapid-key", withSession(session, locale), session.apiBaseUrl).then(
    (response) => response.data.public_key,
  );
}

export async function savePushSubscription(
  session: Session,
  locale: Locale,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  return apiRequest<{ subscribed: boolean }>("/push/subscribe", {
    ...withSession(session, locale),
    method: "POST",
    body: subscription,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function removePushSubscription(session: Session, locale: Locale, endpoint: string) {
  return apiRequest<{ unsubscribed: boolean }>("/push/subscribe", {
    ...withSession(session, locale),
    method: "DELETE",
    body: { endpoint },
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getPlans(session: Session, locale: Locale) {
  return apiRequest<Plan[]>("/plans", withSession(session, locale), session.apiBaseUrl).then((response) => response.data);
}

export async function getReviews(session: Session, locale: Locale, targetProviderProfileId?: string) {
  return apiRequest<Review[]>("/reviews", {
    ...withSession(session, locale),
    query: { target_provider_profile_id: targetProviderProfileId },
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function createReview(
  session: Session,
  locale: Locale,
  body: {
    mission_id: string;
    target_provider_profile_id?: string | null;
    target_user_id?: string | null;
    rating: number;
    comment?: string | null;
  },
) {
  return apiRequest<Review>("/reviews", {
    ...withSession(session, locale),
    method: "POST",
    body,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getMyClientReputation(session: Session, locale: Locale) {
  return apiRequest<Review[]>("/reviews/my-reputation", withSession(session, locale), session.apiBaseUrl).then((r) => r.data);
}

export async function getDisputes(session: Session, locale: Locale) {
  return apiRequest<Dispute[]>("/disputes", withSession(session, locale), session.apiBaseUrl).then((response) => response.data);
}

export async function createDispute(
  session: Session,
  locale: Locale,
  body: { mission_id?: string | null; request_id?: string | null; against_user_id?: string | null; category: string; description: string },
) {
  return apiRequest<Dispute>("/disputes", {
    ...withSession(session, locale),
    method: "POST",
    body,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getDisputeMessages(session: Session, locale: Locale, disputeId: string) {
  return apiRequest<DisputeMessage[]>(`/disputes/${disputeId}/messages`, withSession(session, locale), session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function sendDisputeMessage(
  session: Session,
  locale: Locale,
  disputeId: string,
  body: { body: string; attachment_url?: string | null },
) {
  return apiRequest<DisputeMessage>(`/disputes/${disputeId}/messages`, {
    ...withSession(session, locale),
    method: "POST",
    body,
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getSubscriptions(session: Session, locale: Locale) {
  return apiRequest<Subscription[]>("/subscriptions", withSession(session, locale), session.apiBaseUrl).then(
    (response) => response.data,
  );
}

export async function startSubscriptionCheckout(
  session: Session,
  locale: Locale,
  planId: string,
  urls: { success_url: string; cancel_url: string },
) {
  return apiRequest<{ subscription: Subscription | null; checkout_url: string | null }>(
    "/subscriptions/checkout",
    {
      ...withSession(session, locale),
      method: "POST",
      body: { plan_id: planId, ...urls },
    },
    session.apiBaseUrl,
  ).then((response) => response.data);
}

export async function cancelSubscription(session: Session, locale: Locale, subscriptionId: string) {
  return apiRequest<Subscription>(`/billing/subscriptions/${subscriptionId}/cancel`, {
    ...withSession(session, locale),
    method: "POST",
    body: {},
  }, session.apiBaseUrl).then((response) => response.data);
}

export async function getProviderAnalytics(session: Session, locale: Locale) {
  return apiRequest<ProviderAnalytics>("/provider-profiles/me/analytics", withSession(session, locale), session.apiBaseUrl).then((r) => r.data);
}

export async function getMyReferralStats(session: Session, locale: Locale) {
  return apiRequest<ReferralStats>("/referrals/me", withSession(session, locale), session.apiBaseUrl).then(
    (r) => r.data,
  );
}

export async function validateReferralCode(locale: Locale, code: string) {
  return apiRequest<{ valid: boolean; referrer_name: string }>(
    `/referrals/validate/${encodeURIComponent(code.toUpperCase().trim())}`,
    { locale },
  ).then((r) => r.data);
}
