// Telegram Bot Service - Disabled by default

const sendSignalToTelegram = async (signal) => {
    // Telegram is disabled by default
    console.log('📱 Telegram: Signal would be sent:', signal.pair);
    return;
};

const initTelegramBot = () => {
    console.log('⚠️ Telegram bot disabled');
    return null;
};

module.exports = { initTelegramBot, sendSignalToTelegram };