
import { Movie, SourceKey, DEFAULT_SOURCES, CATEGORY_MAP, Category, SourceConfig } from "../types";

const CACHE = new Map<string, { data: Movie[], expiry: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const getSources = (): SourceConfig[] => {
  const custom = localStorage.getItem('custom_sources');
  const parsedCustom = custom ? JSON.parse(custom) : [];
  return [...DEFAULT_SOURCES, ...parsedCustom];
};

const parsePlayUrls = (urlStr: string) => {
  if (!urlStr) return [];
  return urlStr.split('#').map(item => {
    const parts = item.split('$');
    return {
      name: parts[0] || '正片',
      url: parts[1] || parts[0]
    };
  }).filter(item => item.url && item.url.startsWith('http'));
};

export const fetchVodData = async (
  sourceKey: SourceKey, 
  page: number = 1, 
  keyword?: string, 
  category?: Category
): Promise<Movie[]> => {
  const cacheKey = `${sourceKey}-${page}-${keyword || ''}-${category || 'all'}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return cached.data;

  const allSources = getSources();
  const source = allSources.find(s => s.key === sourceKey) || allSources[0];
  const typeId = category ? CATEGORY_MAP[category] : undefined;
  
  const params = new URLSearchParams({
    ac: 'detail',
    pg: page.toString(),
  });

  if (keyword) params.append('wd', keyword);
  if (typeId) params.append('t', typeId.toString());

  try {
    const response = await fetch(`${source.baseUrl}?${params.toString()}`, { signal: AbortSignal.timeout(8000) });
    const data = await response.json();
    if (!data.list) return [];

    const results = data.list.map((item: any) => ({
      id: item.vod_id.toString(),
      title: item.vod_name,
      rating: parseFloat(item.vod_score) || 7.0,
      posterUrl: item.vod_pic,
      genre: item.vod_class,
      area: item.vod_area,
      year: item.vod_year,
      description: item.vod_content,
      source: sourceKey,
      updateTime: item.vod_time,
      director: item.vod_director,
      actor: item.vod_actor,
      playUrls: parsePlayUrls(item.vod_play_url)
    }));

    CACHE.set(cacheKey, { data: results, expiry: Date.now() + CACHE_TTL });
    return results;
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error);
    return [];
  }
};

/** Aggregated Search Feature */
export const searchAllSources = async (keyword: string): Promise<Movie[]> => {
  const sources = getSources().slice(0, 3); // Top 3 stable sources
  const promises = sources.map(s => fetchVodData(s.key, 1, keyword));
  const results = await Promise.allSettled(promises);
  
  const allMovies: Movie[] = [];
  results.forEach(res => {
    if (res.status === 'fulfilled') allMovies.push(...res.value);
  });

  // Unique by title
  const seen = new Set();
  return allMovies.filter(m => {
    const key = `${m.title}-${m.year}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
