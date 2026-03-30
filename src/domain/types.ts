// ─────────────────────────────────────────────
//  API Keys  —  /api/v1/auth/api-keys/*
// ─────────────────────────────────────────────
export interface APIKey {
  key_id: string;
  api_key: string;            // solo presente al crear
  title: string;
  description?: string | null;
  enabled: boolean;
  created_at: string;
  last_used?: string | null;
  is_admin: boolean;          // era is_master — ese campo NO existe en la API
}

export interface APIKeyCreate {
  title: string;
  description?: string;
}

export interface APIKeyUpdate {
  title?: string | null;
  description?: string | null;
  enabled?: boolean | null;
}

export interface APIKeyListResponse {
  total: number;
  keys: APIKey[];
}

export interface APIKeyVerifyResponse {
  valid: boolean;
  key_id?: string | null;
  title?: string | null;
}

export interface HealthResponse {
  status: string;
  version?: string;
}

// ─────────────────────────────────────────────
//  Browser Accounts  —  /api/v1/auth/browser/*
// ─────────────────────────────────────────────
export interface BrowserAccount {
  name: string;
  available: boolean;
  error_count: number;
  rate_limited_until?: number | null;
  last_used: number;          // UNIX timestamp, required
}

export interface BrowserListResponse {
  total: number;
  available: number;
  accounts: BrowserAccount[];
}

export interface BrowserAddResponse {
  success: boolean;
  account_name: string;
  message: string;
}

export interface BrowserTestResponse {
  success: boolean;
  message: string;
  account_used?: string | null;
}

// ─────────────────────────────────────────────
//  Auth Status  —  /api/v1/auth/status
// ─────────────────────────────────────────────
export interface AuthStatusResponse {
  authenticated: boolean;
  method: string;
  total_accounts: number;
  available_accounts: number;
  accounts?: BrowserAccount[];
}

// ─────────────────────────────────────────────
//  System Stats  —  /api/v1/stats/stats
//  Nota: los sub-objetos son Record genérico según la spec
// ─────────────────────────────────────────────
export interface StatsResponse {
  service: string;
  version?: string | null;
  error?: string | null;
  rate_limiting?: Record<string, unknown> | null;
  caching?: Record<string, unknown> | null;
  cache_manager?: Record<string, unknown> | null;
  circuit_breaker?: Record<string, unknown> | null;
  performance?: Record<string, unknown> | null;
}

// ─────────────────────────────────────────────
//  Cache Stats  —  /api/v1/stream/cache/stats
// ─────────────────────────────────────────────
export interface CacheStatsResponse {
  keys?: number | null;
  size?: string | null;
  ttl?: number | null;
}

export interface CacheClearResponse {
  status: string;
  pattern?: string | null;
}

// ─────────────────────────────────────────────
//  Cache Info  —  /api/v1/stream/cache/info/{video_id}
// ─────────────────────────────────────────────
export interface CacheMetadataInfo {
  metadata?: boolean | null;
  metadata_timestamp?: number | null;
  metadata_value?: unknown;
  stream_url?: boolean | null;
  url_timestamp?: number | null;
  url_value?: string | null;    // URL truncada
}

export interface CacheInfoResponse {
  videoId: string;
  cached?: CacheMetadataInfo | null;
}

// ─────────────────────────────────────────────
//  Stream Cache Status  —  /api/v1/stream/status/{video_id}
// ─────────────────────────────────────────────
export interface StreamCacheStatusResponse {
  videoId: string;
  cached: boolean;
  expiresIn?: number | null;
}

// ─────────────────────────────────────────────
//  Cache Delete  —  DELETE /api/v1/stream/cache/{video_id}
// ─────────────────────────────────────────────
export interface CacheDeleteResponse {
  videoId: string;
  deleted?: {
    metadata?: boolean | null;
    stream_url?: boolean | null;
  } | null;
}
