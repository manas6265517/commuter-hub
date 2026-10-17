const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// GET live train status
router.get('/', async (req, res) => {
    // These are the actual train numbers for the Janshatabdi on your route
    const trains = [
        { trainNo: '20825', name: 'Vande Bharat Express', route: 'Raigarh → Raipur' },
        { trainNo: '12070', name: 'Janshatabdi Express', route: 'Raipur → Raigarh' },
        { trainNo: '12441', name: 'Rajdhani Express', route: 'Raipur → Nagpur' },
        { trainNo: '12261', name: 'Duranto Express', route: 'CSMT → Howrah' },
        { trainNo: '15906', name: 'Vivek Express', route: 'Dibrugarh → Kanyakumari' },
        { trainNo: '12275', name: 'Humsafar Express', route: 'Prayagraj → New Delhi' }
    ];

    try {
        const statuses = await Promise.all(trains.map(async (train) => {
            try {
                // 1. Axios fetches the raw HTML from a public train tracker
                const { data } = await axios.get(`https://etrain.info/train/${train.trainNo}/live`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                
                // 2. Cheerio loads the HTML so we can select elements like jQuery
                const $ = cheerio.load(data);
                
                // 3. Extract the text (We look for standard warning/success colors in their UI)
                const isDelayed = $('span.text-danger, .msg-late').length > 0;
                
                return {
                    train: `${train.name} (${train.trainNo})`,
                    route: train.route,
                    status: isDelayed ? 'Delayed' : 'On Time',
                    delay: isDelayed ? 'Check IRCTC' : '0 mins',
                    lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            } catch (err) {
                // 4. Graceful Fallback: If the site blocks the scraping bot, handle it cleanly
                return {
                    train: `${train.name} (${train.trainNo})`,
                    route: train.route,
                    status: 'Server Blocked',
                    delay: 'Scraper caught by Cloudflare',
                    lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            }
        }));

        res.json(statuses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching train statuses', error: error.message });
    }
});

module.exports = router;