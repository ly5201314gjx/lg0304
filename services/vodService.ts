
import { Movie, SourceKey, DEFAULT_SOURCES, CATEGORY_MAP, Category, SourceConfig } from "../types";

export const getSources = (): SourceConfig[] => {
  const custom = localStorage.getItem('custom_sources');
  const parsedCustom = custom ? JSON.parse(custom) : [];
  return [...DEFAULT_SOURCES, ...parsedCustom];
};

const parsePlayUrls = (urlStr: string) => {
  if (!urlStr) return [];
  // Typical CMS format: "Episode1$url#Episode2$url" or "m3u8$url"
  return urlStr.split('#').map(item => {
    const parts = item.split('$');
    return {
      name: parts[0] || '正片',
      url: parts[1] || parts[0]
    };
  }).filter(item => item.url.startsWith('http'));
};

export const fetchVodData = async (
  sourceKey: SourceKey, 
  page: number = 1, 
  keyword?: string, 
  category?: Category
): Promise<Movie[]> => {
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
    const response = await fetch(`${source.baseUrl}?${params.toString()}`);
    const data = await response.json();
    
    if (!data.list) return [];

    return data.list.map((item: any) => ({
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
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error);
    return [];
  }
};
