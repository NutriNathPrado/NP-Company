export type DashboardPost = {
  id: string;
  caption?: string;
  mediaType?: string;
  timestamp?: string;
  permalink?: string;
  thumbnail?: string;
  likes?: number;
  comments?: number;
  reach?: number;
  saved?: number;
  shares?: number;
  totalInteractions?: number;
  views?: number;
};

export type InstagramDashboardSnapshot = {
  updatedAt: string;
  profile: { username: string; followers: number; mediaCount: number; picture?: string };
  account?: {
    newFollowers30?: number;
    unfollows30?: number;
    newFollowers7?: number;
    unfollows7?: number;
    profileViews30?: number;
  };
  posts: DashboardPost[];
};

export function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function engagement(post: DashboardPost): number {
  return (post.likes || 0) + (post.comments || 0) + (post.saved || 0) + (post.shares || 0);
}

export function sumAvailable(posts: DashboardPost[], key: "reach" | "views"): number | null {
  const values = posts.map((post) => post[key]).filter(hasNumber);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

export function postsSince(posts: DashboardPost[], days: number, now = Date.now()): DashboardPost[] {
  const from = now - days * 24 * 60 * 60 * 1000;
  return posts.filter((post) => {
    if (!post.timestamp) return false;
    const time = new Date(post.timestamp).getTime();
    return Number.isFinite(time) && time >= from && time <= now;
  });
}

export function percent(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  return hasNumber(numerator) && hasNumber(denominator) && denominator > 0 ? (numerator / denominator) * 100 : null;
}

export function ratio(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  return hasNumber(numerator) && hasNumber(denominator) && denominator > 0 ? numerator / denominator : null;
}

export function formatNumber(value: number | null | undefined): string {
  return hasNumber(value) ? new Intl.NumberFormat("pt-BR").format(value) : "—";
}

export function formatPercent(value: number | null | undefined): string {
  return hasNumber(value) ? `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : "—";
}

export function formatDate(value?: string, withTime = false): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", withTime
    ? { dateStyle: "short", timeStyle: "short" }
    : { dateStyle: "short" }).format(date);
}

export function formatLabel(mediaType?: string): string {
  const type = (mediaType || "").toUpperCase();
  if (type.includes("REEL")) return "Reels";
  if (type.includes("CAROUSEL")) return "Carrossel";
  if (type.includes("STORY")) return "Story";
  if (type.includes("VIDEO")) return "Vídeo";
  if (type.includes("IMAGE") || type.includes("PHOTO")) return "Foto";
  return "Feed";
}
