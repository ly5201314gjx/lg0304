
export type SourceKey = string;

export interface SourceConfig {
  key: SourceKey;
  name: string;
  baseUrl: string;
  isCustom?: boolean;
}

export const DEFAULT_SOURCES: SourceConfig[] = [
  { key: 'lzi', name: '量子资源 (4K)', baseUrl: 'https://cj.lziapi.com/api.php/provide/vod/' },
  { key: 'bfzy', name: '播风资源 (HQ)', baseUrl: 'https://bfzyapi.com/api.php/provide/vod/' },
  { key: 'ikun', name: 'Ikun资源 (HD)', baseUrl: 'https://www.ikunzyapi.com/api.php/provide/vod/' },
  { key: 'kczy', name: '快车资源', baseUrl: 'https://cj.kuaichezy.net/api.php/provide/vod/' },
  { key: 'jszy', name: '极速资源', baseUrl: 'https://jszyapi.com/api.php/provide/vod/' },
  { key: 'snzy', name: '蜗牛资源', baseUrl: 'https://www.snailzy.com/api.php/provide/vod/' }
];

export interface Movie {
  id: string;
  title: string;
  rating: number;
  posterUrl: string;
  genre: string;
  area: string;
  year: string;
  description: string;
  source: SourceKey;
  updateTime: string;
  director: string;
  actor: string;
  playUrls: { name: string; url: string }[];
}

export interface WatchRecord extends Movie {
  watchedAt: number;
}

export type Category = 
  | '全部' | '电影' | '电视剧' | '综艺' | '动漫'
  | '动作' | '喜剧' | '爱情' | '科幻' | '悬疑' 
  | '恐怖' | '动画' | '纪录片' | '犯罪' | '奇幻' 
  | '战争' | '惊悚' | '剧情';

export const CATEGORIES: Category[] = [
  '全部', '电影', '电视剧', '综艺', '动漫',
  '动作', '喜剧', '爱情', '科幻', '悬疑', 
  '恐怖', '动画', '纪录片', '犯罪', '奇幻', 
  '战争', '惊悚', '剧情'
];

export const CATEGORY_MAP: Record<Category, number | undefined> = {
  '全部': undefined, '电影': 1, '电视剧': 2, '综艺': 3, '动漫': 4,
  '动作': 6, '喜剧': 7, '爱情': 8, '科幻': 9, '悬疑': 10,
  '恐怖': 11, '动画': 24, '纪录片': 20, '犯罪': 21, '奇幻': 22,
  '战争': 12, '惊悚': 13, '剧情': 14
};
