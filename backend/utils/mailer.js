const nodemailer = require('nodemailer');
const config = require('../config/config');
let transporter = null;

async function createTransporter() {
    // If transporter already exists, return it
    if (transporter) return transporter;

    // Check if SMTP is configured in production
    if (config.mail && config.mail.host && config.mail.user && config.mail.pass) {
        try {
            transporter = nodemailer.createTransport({
                host: config.mail.host,
                port: config.mail.port,
                secure: !!config.mail.secure,
                auth: {
                    user: config.mail.user,
                    pass: config.mail.pass
                },
                pool: {
                    maxConnections: 10,
                    maxMessages: 100,
                    rateDelta: 4000,
                    rateLimit: 14
                }
            });
            
            // Verify transporter connection in production
            await transporter.verify();
            console.log('SMTP transporter verified successfully');
            return transporter;
        } catch (error) {
            console.error('SMTP transporter error:', error.message);
            // Fallback to test account
            transporter = null;
        }
    }

    // Fallback to ethereal test account for development
    try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
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
