const WIKI_HEADERS = { "User-Agent": "destination-finder-familie-meyer/1.0" };

// Locator maps, flags and coats of arms are usually the lead image on
// country/region articles, but make poor destination photos. Prefer an
// actual photograph from elsewhere in the article when the lead image
// looks like one of these.
const NON_PHOTO_KEYWORDS = [
  "flag",
  "flagge",
  "coat_of_arms",
  "wappen",
  "karte",
  "map",
  "locator",
  "relief",
  "siegel",
  "seal",
  "logo",
  "symbol",
  "icon",
  "banner",
  "emblem",
  "satellite",
];

function looksLikePhoto(url: string): boolean {
  const lower = url.toLowerCase();
  if (!/\.jpe?g(\?|$)/.test(lower)) return false;
  return !NON_PHOTO_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function toAbsolute(url: string): string {
  return url.startsWith("http") ? url : `https:${url}`;
}

async function fetchJson(url: string, signal: AbortSignal) {
  const res = await fetch(url, { headers: WIKI_HEADERS, signal });
  if (!res.ok) return null;
  return res.json();
}

export async function findDestinationImage(title: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const searchData = await fetchJson(
      `https://de.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(title)}&limit=1`,
      controller.signal
    );
    const key = searchData?.pages?.[0]?.key as string | undefined;
    if (!key) return null;

    const summary = await fetchJson(
      `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`,
      controller.signal
    );
    const summarySource = summary?.thumbnail?.source as string | undefined;

    if (summarySource && looksLikePhoto(summarySource)) {
      return summarySource;
    }

    // The lead image is missing or isn't a real photo (map, flag, coat of
    // arms) — look for one used further down in the article instead.
    const mediaList = await fetchJson(
      `https://de.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(key)}`,
      controller.signal
    );
    const items = (mediaList?.items ?? []) as Array<{
      type?: string;
      title?: string;
      srcset?: { src: string }[];
    }>;

    for (const item of items) {
      if (item.type !== "image" || !item.srcset?.length) continue;
      const bestSrc = item.srcset[item.srcset.length - 1].src;
      if (looksLikePhoto(bestSrc)) {
        return toAbsolute(bestSrc);
      }
    }

    return summarySource ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
