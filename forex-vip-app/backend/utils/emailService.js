let nodemailer = null;

try {
    nodemailer = require('nodemailer');
} catch (error) {
    console.log('⚠️ Nodemailer not installed - email features disabled');
}

let transporter = null;

const initTransporter = () => {
    try {
        if (!nodemailer || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('⚠️ Email not configured - email features disabled');
            return null;
        }
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log('✅ Email service initialized');
        return transporter;
    } catch (error) {
        console.log('⚠️ Email service error:', error.message);
        return null;
    }
};

const sendWelcomeEmail = async (user, plan, price) => {
    try {
        if (!transporter) {
            console.log('📧 Email not sent - service not configured');
            return;
        }

        const planNames = {
            monthly: 'Monthly',
            quarterly: 'Quarterly',
            yearly: 'Yearly'
        };

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@forexpro.co.za',
            to: user.email,
            subject: '🎉 Welcome to ForexPro SA VIP!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a1a; color: white;">
                    <h1 style="color: #00b894;">🇿🇦 Welcome to ForexPro SA VIP!</h1>
                    <p>Hello ${user.name},</p>
                    <p>Thank you for joining ForexPro South Africa! Your VIP subscription is now active.</p>
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #00b894;">
                        <p><strong>📌 Plan:</strong> ${planNames[plan] || plan}</p>
                        <p><strong>💰 Price:</strong> R${price} ZAR</p>
                        <p><strong>📅 Active Until:</strong> ${new Date(user.subscriptionEnd).toLocaleDateString('en-ZA')}</p>
                    </div>
                    <div style="background: #8B0000; color: white; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        ⚠️ <strong>FSCA RISK WARNING:</strong> Forex trading carries substantial risk. Only trade with funds you can afford to lose.
                    </div>
                    <a href="${process.env.CLIENT_URL}/dashboard.html" style="background: #00b894; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block;">
                        🚀 Access Dashboard
                    </a>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (error) {
        console.log('⚠️ Could not send email:', error.message);
    }
};

const sendSignalEmail = async (user, signal) => {
    try {
        if (!transporter) {
            console.log('📧 Signal email not sent - service not configured');
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@forexpro.co.za',
            to: user.email,
            subject: `📊 New VIP Signal: ${signal.pair}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a1a; color: white;">
                    <h2 style="color: #00b894;">📊 New VIP Signal Alert</h2>
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #00b894;">
                        <p><strong>📌 Pair:</strong> ${signal.pair}</p>
                        <p><strong>🔹 Action:</strong> ${signal.action}</p>
                        <p><strong>💰 Entry:</strong> ${signal.entry}</p>
                        <p><strong>🎯 Take Profit:</strong> ${signal.takeProfit}</p>
                        <p><strong>🛑 Stop Loss:</strong> ${signal.stopLoss}</p>
                        <p><strong>📈 Confidence:</strong> ${signal.confidence}</p>
                        ${signal.analysis ? `<p><strong>📝 Analysis:</strong> ${signal.analysis}</p>` : ''}
                    </div>
                    <div style="background: #8B0000; color: white; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        ⚠️ <strong>FSCA RISK WARNING:</strong> Only trade with funds you can afford to lose.
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Signal email sent to ${user.email}`);
    } catch (error) {
        console.log('⚠️ Could not send signal email:', error.message);
    }
};

initTransporter();

module.exports = { sendWelcomeEmail, sendSignalEmail };