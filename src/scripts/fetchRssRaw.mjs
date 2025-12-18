import axios from 'axios';

(async () => {
    try {
        const url = 'https://vnexpress.net/rss/tin-thoi-trang.rss';
        const res = await axios.get(url, { responseType: 'text', timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml,application/xml,text/xml', 'Referer': 'https://vnexpress.net/', 'Accept-Language': 'vi-VN,vi;q=0.9' } });
        const xml = res.data;
        console.log(xml.slice(0, 2000));
    } catch (err) {
        console.error('ERR', err.message || err);
        process.exit(1);
    }
})();
