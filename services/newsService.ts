
import { NewsItem } from '../types';

const RSS_URL = 'https://news.google.com/rss/search?q=kdrama+doramas+lançamentos+netflix+viki+kpop&hl=pt-BR&gl=BR&ceid=BR:pt-419';
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;
const CACHE_KEY = 'eudorama_news_cache';
const CACHE_TIME = 3 * 60 * 60 * 1000; // 3 Horas

// Fallback images (Unsplash - Reliable & High Quality)
const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1596727147705-01a298de8ade?q=80&w=800&auto=format&fit=crop', // Seoul Street
    'https://images.unsplash.com/photo-1610123598147-f636307d490b?q=80&w=800&auto=format&fit=crop', // Night Life
    'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=800&auto=format&fit=crop', // Cherry Blossom
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=800&auto=format&fit=crop', // Food
    'https://images.unsplash.com/photo-1535189043414-47a3c49a0bed?q=80&w=800&auto=format&fit=crop'  // Traditional
];

const KEYWORD_IMAGES: Record<string, string> = {
    'netflix': 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800&auto=format&fit=crop',
    'viki': 'https://images.unsplash.com/photo-1522869635100-1f4d068ee30c?q=80&w=800&auto=format&fit=crop', // Blue aesthetic
    'disney': 'https://images.unsplash.com/photo-1620175850125-728b9d03478b?q=80&w=800&auto=format&fit=crop',
    'amor': 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?q=80&w=800&auto=format&fit=crop',
};

export const getDoramaNews = async (): Promise<NewsItem[]> => {
    try {
        // 1. Check Cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            if (age < CACHE_TIME && data.length > 0) {
                console.log('Using cached news');
                return data;
            }
        }

        // 2. Fetch New Data
        console.log('Fetching new news from Google RSS...');
        const response = await fetch(API_URL);
        const json = await response.json();

        if (json.status !== 'ok') {
            throw new Error('Failed to fetch RSS');
        }

        // 3. Process Items
        const items: NewsItem[] = json.items.slice(0, 5).map((item: any, index: number) => {
            let img = item.enclosure?.link;

            // Try to extract from description if enclosure is missing
            if (!img && item.description) {
                const imgMatch = item.description.match(/src="(.*?)"/);
                if (imgMatch) {
                    img = imgMatch[1];
                }
            }

            // Keyword based image assignment (Better than random)
            const lowerTitle = item.title.toLowerCase();
            if (!img) {
                for (const [key, url] of Object.entries(KEYWORD_IMAGES)) {
                    if (lowerTitle.includes(key)) {
                        img = url;
                        break;
                    }
                }
            }

            // Final fallback logic
            // Google images usually start with "https://t", if it's too short or missing, assign fallback
            if (!img || img.length < 15) {
                img = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
            }

            return {
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                image: img,
                source: item.source?.title || 'Google News'
            };
        });

        // 4. Save to Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: items,
            timestamp: Date.now()
        }));

        return items;

    } catch (error) {
        console.error('News fetch error:', error);
        // Return existing cache even if expired if fetch fails, or empty
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached).data;
        return [];
    }
};
