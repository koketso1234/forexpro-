let axios = null;

try {
    axios = require('axios');
} catch (error) {
    console.log('⚠️ Axios not installed - using simulated rates only');
}

const ALL_PAIRS = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'GBP/JPY', 'GBP/CHF', 'GBP/AUD', 'AUD/JPY',
    'AUD/CHF', 'AUD/NZD', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY', 'NZD/CHF', 'NZD/CAD',
    'EUR/SEK', 'EUR/NOK', 'EUR/DKK', 'GBP/SEK', 'GBP/NOK', 'USD/SEK', 'USD/NOK',
    'USD/DKK', 'USD/TRY', 'USD/SGD', 'USD/HKD', 'USD/MXN', 'USD/PLN', 'USD/CZK',
    'USD/HUF', 'USD/ILS', 'USD/KRW', 'USD/TWD', 'USD/THB', 'USD/CNY', 'USD/INR',
    'USD/BRL', 'USD/RUB',
    'USD/ZAR', 'EUR/ZAR', 'GBP/ZAR', 'AUD/ZAR', 'NZD/ZAR', 'JPY/ZAR', 'CHF/ZAR',
    'CAD/ZAR', 'SEK/ZAR', 'NOK/ZAR', 'DKK/ZAR', 'CNY/ZAR', 'INR/ZAR', 'TRY/ZAR',
    'PLN/ZAR', 'CZK/ZAR', 'HUF/ZAR', 'SGD/ZAR', 'HKD/ZAR', 'MXN/ZAR', 'BRL/ZAR',
    'RUB/ZAR',
    'XAU/USD', 'XAG/USD', 'XAU/ZAR', 'XAG/ZAR',
    'BTC/USD', 'ETH/USD', 'BTC/ZAR', 'ETH/ZAR'
];

const BASE_PRICES = {
    'EUR/USD': 1.0892, 'GBP/USD': 1.2650, 'USD/JPY': 148.50,
    'AUD/USD': 0.6540, 'USD/CAD': 1.3520, 'USD/CHF': 0.9120, 'NZD/USD': 0.5980,
    'EUR/GBP': 0.8610, 'EUR/JPY': 161.80, 'EUR/CHF': 0.9930,
    'GBP/JPY': 187.90, 'GBP/CHF': 1.1530, 'GBP/AUD': 1.9350,
    'AUD/JPY': 97.20, 'AUD/CHF': 0.5960, 'AUD/NZD': 1.0930,
    'CAD/JPY': 109.80, 'CHF/JPY': 162.90, 'NZD/JPY': 88.80,
    'NZD/CHF': 0.5450, 'NZD/CAD': 0.8180,
    'EUR/SEK': 11.82, 'EUR/NOK': 11.65, 'EUR/DKK': 7.45,
    'GBP/SEK': 13.72, 'GBP/NOK': 13.52, 'USD/SEK': 10.85,
    'USD/NOK': 10.69, 'USD/DKK': 6.84, 'USD/TRY': 32.45,
    'USD/SGD': 1.345, 'USD/HKD': 7.82, 'USD/MXN': 16.85,
    'USD/PLN': 3.98, 'USD/CZK': 22.85, 'USD/HUF': 360.50,
    'USD/ILS': 3.72, 'USD/KRW': 1320.00, 'USD/TWD': 31.85,
    'USD/THB': 36.20, 'USD/CNY': 7.25, 'USD/INR': 83.50,
    'USD/BRL': 5.12, 'USD/RUB': 92.50,
    'USD/ZAR': 18.75, 'EUR/ZAR': 20.12, 'GBP/ZAR': 23.45,
    'AUD/ZAR': 12.30, 'NZD/ZAR': 11.25, 'JPY/ZAR': 0.126,
    'CHF/ZAR': 20.60, 'CAD/ZAR': 13.85, 'SEK/ZAR': 1.72,
    'NOK/ZAR': 1.75, 'DKK/ZAR': 2.74, 'CNY/ZAR': 2.58,
    'INR/ZAR': 0.224, 'TRY/ZAR': 0.577, 'PLN/ZAR': 4.72,
    'CZK/ZAR': 0.820, 'HUF/ZAR': 0.052, 'SGD/ZAR': 13.92,
    'HKD/ZAR': 2.40, 'MXN/ZAR': 1.11, 'BRL/ZAR': 3.66,
    'RUB/ZAR': 0.203,
    'XAU/USD': 2345.00, 'XAG/USD': 27.80, 'XAU/ZAR': 43950.00, 'XAG/ZAR': 521.00,
    'BTC/USD': 65000.00, 'ETH/USD': 3500.00, 'BTC/ZAR': 1218000.00, 'ETH/ZAR': 65600.00
};

const getLiveRates = async () => {
    try {
        if (process.env.FINNHUB_API_KEY && axios) {
            try {
                return await getFinnhubRates();
            } catch (error) {
                console.log('⚠️ Finnhub API failed, using fallback');
            }
        }
        return getSimulatedRates();
    } catch (error) {
        console.error('❌ Market API Error:', error.message);
        return getSimulatedRates();
    }
};

const getFinnhubRates = async () => {
    const rates = {};
    const fetchPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD', 'USD/ZAR', 'EUR/ZAR', 'GBP/ZAR'];
    
    for (const pair of fetchPairs) {
        const [from, to] = pair.split('/');
        try {
            const response = await axios.get(
                `https://finnhub.io/api/v1/forex/rates?base=${from}`,
                { params: { token: process.env.FINNHUB_API_KEY } }
            );
            const data = response.data;
            if (data && data.quote && data.quote[to]) {
                const price = data.quote[to];
                const change = (Math.random() - 0.5) * 0.004;
                rates[pair] = {
                    price: parseFloat(price).toFixed(4),
                    change: `${change > 0 ? '+' : ''}${(change / price * 100).toFixed(2)}%`,
                    timestamp: new Date().toISOString()
                };
            } else {
                rates[pair] = getSimulatedRate(pair);
            }
        } catch (error) {
            rates[pair] = getSimulatedRate(pair);
        }
    }
    
    for (const pair of ALL_PAIRS) {
        if (!rates[pair]) {
            rates[pair] = getSimulatedRate(pair);
        }
    }
    return rates;
};

const getSimulatedRate = (pair) => {
    const base = BASE_PRICES[pair] || 1.0000;
    const variation = (Math.random() - 0.5) * 0.005;
    const price = base + variation;
    const change = (variation / base * 100);
    return {
        price: parseFloat(price).toFixed(4),
        change: `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
        timestamp: new Date().toISOString()
    };
};

const getSimulatedRates = () => {
    const rates = {};
    ALL_PAIRS.forEach(pair => {
        rates[pair] = getSimulatedRate(pair);
    });
    return rates;
};

module.exports = { getLiveRates, ALL_PAIRS };