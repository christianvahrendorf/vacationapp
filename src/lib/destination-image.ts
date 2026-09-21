const WIKI_HEADERS = { "User-Agent": "destination-finder-familie-meyer/1.0" };

export async function findDestinationImage(title: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const searchRes = await fetch(
      `https://de.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(title)}&limit=1`,
      { headers: WIKI_HEADERS, signal: controller.signal }
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const key = searchData?.pages?.[0]?.key as string | undefined;
    if (!key) return null;

    // The summary endpoint returns a pre-generated thumbnail size that
    // Wikimedia's image host actually serves, unlike arbitrary widths
    // spliced into the thumbnail URL, which get rejected.
    const summaryRes = await fetch(
      `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`,
      { headers: WIKI_HEADERS, signal: controller.signal }
    );
    if (!summaryRes.ok) return null;

    const summary = await summaryRes.json();
    return (summary?.thumbnail?.source as string | undefined) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
