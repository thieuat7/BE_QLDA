import axios from 'axios';

(async () => {
    try {
        const res = await axios.get('http://localhost:3000/api/tin-tuc', { timeout: 5000 });
        console.log('STATUS', res.status);
        console.log('DATA', JSON.stringify(res.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.error('ERROR_STATUS', err.response.status);
            console.error('ERROR_DATA', err.response.data);
        } else {
            console.error('REQUEST_ERROR', err.message);
        }
        process.exit(1);
    }
})();
