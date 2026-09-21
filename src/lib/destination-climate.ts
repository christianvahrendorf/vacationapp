const WIKI_HEADERS = { "User-Agent": "destination-finder-familie-meyer/1.0" };

const MONTH_ABBR_DE = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

const PLEASANT_TARGET_C = 24;
const BEST_MONTH_COUNT = 4;
const CLIMATE_YEARS = 10;

export type DestinationClimate = {
  bestMonths: number[]; // 0-11, sorted ascending
  bestMonthsLabel: string; // e.g. "Mai–Jun, Sep–Okt"
  avgHighBestMonths: number; // °C, rounded
};

async function fetchJson(url: string, signal: AbortSignal) {
  const res = await fetch(url, { headers: WIKI_HEADERS, signal });
  if (!res.ok) return null;
  return res.json();
}

async function findCoordinates(
  title: string,
  signal: AbortSignal
): Promise<{ lat: number; lon: number } | null> {
  const searchData = await fetchJson(
    `https://de.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(title)}&limit=1`,
    signal
  );
  const key = searchData?.pages?.[0]?.key as string | undefined;
  if (!key) return null;

  const summary = await fetchJson(
    `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`,
    signal
  );
  const lat = summary?.coordinates?.lat as number | undefined;
  const lon = summary?.coordinates?.lon as number | undefined;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  return { lat, lon };
}

async function fetchMonthlyAvgHighs(
  lat: number,
  lon: number,
  signal: AbortSignal
): Promise<number[] | null> {
  const endYear = new Date().getUTCFullYear() - 1;
  const startYear = endYear - (CLIMATE_YEARS - 1);

  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startYear}-01-01&end_date=${endYear}-12-31&daily=temperature_2m_max&timezone=UTC`,
    { signal }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const dates = (data?.daily?.time ?? []) as string[];
  const highs = (data?.daily?.temperature_2m_max ?? []) as (number | null)[];
  if (dates.length === 0) return null;

  const sums = new Array(12).fill(0);
  const counts = new Array(12).fill(0);
  dates.forEach((date, i) => {
    const value = highs[i];
    if (value == null) return;
    const month = Number(date.slice(5, 7)) - 1;
    sums[month] += value;
    counts[month] += 1;
  });

  if (counts.some((c) => c === 0)) return null;
  return sums.map((sum, i) => sum / counts[i]);
}

function pickBestMonths(avgHighs: number[]): number[] {
  return avgHighs
    .map((temp, month) => ({ month, diff: Math.abs(temp - PLEASANT_TARGET_C) }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, BEST_MONTH_COUNT)
    .map((entry) => entry.month)
    .sort((a, b) => a - b);
}

function formatMonthRanges(months: number[]): string {
  const ranges: string[] = [];
  let rangeStart = months[0];
  let prev = months[0];

  for (let i = 1; i <= months.length; i++) {
    const current = months[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    ranges.push(
      rangeStart === prev
        ? MONTH_ABBR_DE[rangeStart]
        : `${MONTH_ABBR_DE[rangeStart]}–${MONTH_ABBR_DE[prev]}`
    );
    rangeStart = current;
    prev = current;
  }

  return ranges.join(", ");
}

export async function findDestinationClimate(
  title: string
): Promise<DestinationClimate | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const coordinates = await findCoordinates(title, controller.signal);
    if (!coordinates) return null;

    const avgHighs = await fetchMonthlyAvgHighs(
      coordinates.lat,
      coordinates.lon,
      controller.signal
    );
    if (!avgHighs) return null;

    const bestMonths = pickBestMonths(avgHighs);
    const avgHighBestMonths = Math.round(
      bestMonths.reduce((sum, month) => sum + avgHighs[month], 0) / bestMonths.length
    );

    return {
      bestMonths,
      bestMonthsLabel: formatMonthRanges(bestMonths),
      avgHighBestMonths,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
