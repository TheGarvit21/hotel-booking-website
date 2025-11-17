const nodemailer = require('nodemailer');
const config = require('../config/config');
let transporter = null;

async function createTransporter() {
    // If transporter already exists, return it
    if (transporter) return transporter;

    // Check if SMTP is configured in production
    if (config.mail && config.mail.host && config.mail.user && config.mail.pass) {
        try {
            // For Gmail or SMTP with TLS/SSL, use appropriate settings
            let port = config.mail.port || 587;
            let secure = !!config.mail.secure;
            
            // If using port 465, ensure SSL is enabled
            if (port === 465) {
                secure = true;
            }
            
            console.log(`Configuring SMTP: ${config.mail.host}:${port} (secure: ${secure})`);
            
            transporter = nodemailer.createTransport({
                host: config.mail.host,
                port: port,
                secure: secure,
                auth: {
                    user: config.mail.user,
                    pass: config.mail.pass
                },
                connectionTimeout: 10000,
                socketTimeout: 10000,
                pool: {
                    maxConnections: 5,
                    maxMessages: 50,
                    rateDelta: 4000,
                    rateLimit: 14
                }
            });
            
            // Verify transporter connection with timeout
            console.log('Verifying SMTP connection...');
            await Promise.race([
                transporter.verify(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('SMTP verification timeout')), 15000)
                )
            ]);
            console.log('SMTP transporter verified successfully');
            return transporter;
        } catch (error) {
            console.error('SMTP transporter error:', error.message);
            console.error('Will fallback to Ethereal test account');
            // Reset transporter to try fallback
            transporter = null;
        }
    } else {
        console.warn('SMTP not fully configured, using Ethereal test account');
    }

    // Fallback to ethereal test account for development
    try {
        console.log('Creating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            },
            connectionTimeout: 10000,
            socketTimeout: 10000
        });
        console.log('Using Ethereal test account for email');
        return transporter;
    } catch (error) {
        console.error('Failed to create test account:', error.message);
        throw new Error('Email transporter initialization failed');
    }
}

async function sendMail({ to, subject, text, html, from }) {
    try {
        if (!to) {
            throw new Error('Recipient email address is required');
        }

        const mailTransporter = await createTransporter();
        
        const info = await mailTransporter.sendMail({
            from: from || config.mail?.from || 'no-reply@localhost',
            to,
            subject,
            text,
            html
        });

        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send email:', error.message);
        // Re-throw error so calling code can handle it
        throw error;
    }
}

module.exports = { sendMail, createTransporter };
