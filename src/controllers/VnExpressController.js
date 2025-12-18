import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { load } from 'cheerio';

/**
 * GET /api/tin-tuc
 * Fetch VNExpress RSS, parse to JSON and return.
 */
export const getVnexpressNews = async (req, res) => {
    try {
        // Support fetching either a specific feed URL or a parent feed alias
        const parentAlias = req.query.parent;
        const knownParents = {
            'giai-tri': 'https://vnexpress.net/rss/giai-tri.rss'
        };
        const rssUrl = req.query.url || (parentAlias ? (knownParents[parentAlias] || parentAlias) : 'https://vnexpress.net/rss/giai-tri.rss');

        const response = await axios.get(rssUrl, {
            responseType: 'text',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
                'Referer': 'https://vnexpress.net/',
                'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive'
            }
        });
        const xml = response.data;

        // Sanitize XML: escape stray ampersands that are not part of a valid entity
        const safeXml = xml.replace(/&(?!([a-zA-Z]+|#\d+|#x[0-9A-Fa-f]+);)/g, '&amp;');

        // Parse XML to JS object. Try xml2js first, then fall back to fast-xml-parser on error.
        let result;
        try {
            result = await parseStringPromise(safeXml, { explicitArray: false, trim: true });
        } catch (parseErr) {
            console.warn('xml2js parse error, falling back to fast-xml-parser:', parseErr && parseErr.message ? parseErr.message : parseErr);
            // dynamic import to avoid top-level dependency issues
            const { XMLParser } = await import('fast-xml-parser');
            const parser = new XMLParser({
                ignoreAttributes: false,
                trimValues: true,
                allowBooleanAttributes: true,
                parseTagValue: true
            });
            result = parser.parse(safeXml);
        }

        // Normalize items: rss.channel.item or feed.entry
        let items = [];
        if (result.rss && result.rss.channel) {
            const ch = result.rss.channel;
            if (ch.item) {
                items = Array.isArray(ch.item) ? ch.item : [ch.item];
            }
        } else if (result.feed && result.feed.entry) {
            items = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
        }

        // Map to concise structure and extract image + snippet from HTML description
        const news = items.map(it => {
            const title = it.title || '';
            const link = it.link && (typeof it.link === 'string' ? it.link : it.link._) || it.link?.href || '';
            const pubDate = it.pubDate || it.published || it.updated || null;
            // description may live in several fields
            const rawDesc = it.description || it['content:encoded'] || it.summary || it.content || '';

            // Use cheerio to extract first image src and plain-text snippet
            let image = null;
            let snippet = '';
            if (rawDesc) {
                try {
                    const $ = load(rawDesc);
                    const img = $('img').first();
                    if (img && img.attr) {
                        image = img.attr('src') || img.attr('data-src') || null;
                    }

                    // Remove images and scripts/styles then get text
                    $('img').remove();
                    $('script').remove();
                    $('style').remove();
                    snippet = $.root().text().replace(/\s+/g, ' ').trim();
                    if (snippet && snippet.length > 300) snippet = snippet.slice(0, 300) + '...';
                } catch (e) {
                    // fallback: strip tags crudely
                    snippet = String(rawDesc).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
                    if (snippet && snippet.length > 300) snippet = snippet.slice(0, 300) + '...';
                }
            }

            return {
                title,
                link,
                pubDate,
                descriptionHtml: rawDesc,
                snippet,
                image,
                guid: it.guid || null,
                source: rssUrl
            };
        });

        // Optional: filter by a substring in the article link (e.g., 'thoi-trang')
        const pathFilter = req.query.pathFilter;
        const filtered = pathFilter ? news.filter(n => (n.link || '').includes(pathFilter)) : news;

        return res.status(200).json({
            success: true,
            message: 'Lấy tin tức từ RSS thành công',
            data: { news: filtered, total: filtered.length }
        });
    } catch (error) {
        console.error('Fetch VNExpress RSS error:', error.message || error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tin tức từ RSS',
            error: error.message || String(error)
        });
    }
};

export default {
    getVnexpressNews
};
