export type Locale = "fr-CA" | "en-CA";

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  locale: Locale;
  status: "active" | "suspended" | "deleted";
  is_client_enabled: boolean;
  is_provider_enabled: boolean;
  email_verified_at?: string | null;
  avatar_url?: string | null;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  expires: number;
  apiBaseUrl: string;
  user: User;
};

export type ApiEnvelope<T> = {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

export type PlatformSettings = {
  request_publication_payment_enabled: boolean;
  default_request_publication_price_cents: number;
  currency: string;
  brand_logo_url: string | null;
  supported_locales: Locale[];
  default_locale: Locale;
  pwa_push_enabled: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  icon?: string | null;
  marketing_title?: string | null;
  marketing_subtitle?: string | null;
};

export type Service = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  base_publication_price_cents?: number | null;
  image_url?: string | null;
  marketing_title?: string | null;
  price_label?: string | null;
};

export type Zone = {
  id: string;
  parent_id?: string | null;
  type: string;
  name: string;
  code?: string | null;
  image_url?: string | null;
  marketing_blurb?: string | null;
};

export type ProviderProfile = {
  id: string;
  user_id: string;
  display_name?: string | null;
  business_name?: string | null;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  verification_status: string;
  provider_status: string;
  rating_avg: number;
  rating_count: number;
  response_rate?: number | null;
  response_time_avg_minutes?: number | null;
  completed_missions_count: number;
  is_profile_public?: boolean | number;
};

export type PublicProviderHighlight = {
  id: string;
  display_name?: string | null;
  business_name?: string | null;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  rating_avg: number;
  rating_count: number;
  response_time_avg_minutes?: number | null;
  completed_missions_count: number;
  services: string[];
  zones: string[];
};

export type PublicCityHighlight = {
  id: string;
  name: string;
  image_url?: string | null;
  marketing_blurb?: string | null;
  provider_count: number;
  top_services: string[];
};

export type Availability = {
  id: string;
  provider_profile_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean | number;
};

export type RequestItem = {
  id: string;
  client_user_id: string;
  service_id: string;
  zone_id: string;
  title: string;
  description: string;
  desired_date: string;
  time_window_start: string;
  time_window_end: string;
  urgency: string;
  budget_min_cents?: number | null;
  budget_max_cents?: number | null;
  work_mode: string;
  status: string;
  publication_payment_required: boolean | number;
  publication_price_cents: number;
  publication_tax_cents: number;
  publication_total_cents: number;
  published_at?: string | null;
  service_name?: string | null;
  zone_name?: string | null;
  offers_count?: number | null;
};

export type MatchingRequest = {
  id: string;
  title: string;
  description?: string | null;
  desired_date?: string | null;
  time_window_start?: string | null;
  time_window_end?: string | null;
  urgency: string;
  status: string;
  budget_min_cents?: number | null;
  budget_max_cents?: number | null;
  work_mode?: string | null;
  service_id?: string | null;
  category_id?: string | null;
  category_icon?: string | null;
  service_name: string;
  zone_name: string;
  already_quoted: boolean;
  updated_at: string;
  created_at: string;
};

export type PublicationPreview = {
  request_id: string;
  publication_payment_required: boolean;
  publication_price_cents: number;
  publication_tax_cents: number;
  publication_total_cents: number;
  currency: string;
};

export type MatchItem = {
  id: string;
  request_id: string;
  provider_profile_id: string;
  match_score?: number | null;
  is_visible_to_provider: boolean | number;
  responded_at?: string | null;
  request_title?: string | null;
  title?: string | null;
  description?: string | null;
  desired_date?: string | null;
  urgency?: string | null;
};

export type Quote = {
  id: string;
  request_id: string;
  provider_profile_id: string;
  message: string;
  estimated_price_cents?: number | null;
  proposed_date?: string | null;
  proposed_time_window?: string | null;
  status: string;
  submitted_at?: string | null;
  display_name?: string | null;
  business_name?: string | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  conversation_id?: string | null;
};

export type PortfolioItem = {
  id: string;
  provider_profile_id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProviderQuote = {
  id: string;
  request_id: string;
  provider_profile_id: string;
  message: string;
  estimated_price_cents?: number | null;
  proposed_date?: string | null;
  status: string;
  submitted_at?: string | null;
  updated_at?: string | null;
  withdrawn_at?: string | null;
  request_title: string;
  request_status: string;
  conversation_id?: string | null;
};

export type Mission = {
  id: string;
  request_id: string;
  quote_id: string;
  client_user_id: string;
  provider_profile_id: string;
  status: string;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
};

export type NotificationItem = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  is_read: boolean | number;
  created_at?: string;
};

export type NotificationPreferences = {
  id: string;
  user_id: string;
  email_messages_enabled: boolean | number;
  email_quotes_enabled: boolean | number;
  email_billing_enabled: boolean | number;
  email_marketing_enabled: boolean | number;
  push_enabled: boolean | number;
};

export type ReferralEntry = {
  referred_id: string;
  referred_name: string;
  status: "pending" | "completed";
  created_at: string;
  completed_at: string | null;
};

export type ReferralStats = {
  referral_code: string | null;
  total: number;
  completed: number;
  pending: number;
  referrals: ReferralEntry[];
};

export type Conversation = {
  id: string;
  request_id?: string | null;
  mission_id?: string | null;
  client_user_id: string;
  provider_profile_id: string;
  status: string;
  request_title?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  message_type: string;
  body?: string | null;
  attachment_url?: string | null;
  read_at?: string | null;
  created_at?: string;
};

export type Plan = {
  id: string;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  response_limit?: number | null;
  priority_level: number;
  status: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  provider_profile_id: string;
  plan_id: string;
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
  cancel_at_period_end: boolean | number;
  plan_code?: string;
  plan_name?: string;
  response_limit?: number | null;
  priority_level?: number | null;
};

export type Review = {
  id: string;
  mission_id: string;
  author_user_id: string;
  target_provider_profile_id?: string | null;
  target_user_id?: string | null;
  rating: number;
  comment?: string | null;
  status: string;
  published_at?: string | null;
  created_at?: string;
  // joined fields
  author_first_name?: string | null;
  author_last_name?: string | null;
  author_display_name?: string | null;
  author_business_name?: string | null;
};

export type Dispute = {
  id: string;
  mission_id?: string | null;
  request_id?: string | null;
  opened_by_user_id: string;
  against_user_id?: string | null;
  category?: string | null;
  description: string;
  status: string;
  resolution_type?: string | null;
  resolution_note?: string | null;
  resolved_at?: string | null;
  created_at?: string;
};

export type DisputeMessage = {
  id: string;
  dispute_id: string;
  sender_user_id: string;
  body: string;
  attachment_url?: string | null;
  created_at?: string;
};

export type ProviderAnalytics = {
  leads_total: number;
  quotes_total: number;
  accepted_total: number;
  missions_completed: number;
  response_rate: number | null;
  conversion_rate: number | null;
  revenue_cents: number;
  monthly_leads: { month: string; leads: number }[];
  monthly_revenue: { month: string; revenue_cents: number }[];
};
