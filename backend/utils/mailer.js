const nodemailer = require('nodemailer');
const config = require('../config/config');
let transporterPromise = null;

async function createTransporter() {
    if (transporterPromise) return transporterPromise;
    if (config.mail && config.mail.host) {
        transporterPromise = Promise.resolve(nodemailer.createTransport({
            host: config.mail.host,
            port: config.mail.port,
            secure: !!config.mail.secure,
            auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined
        }));
        return transporterPromise;
    }
    transporterPromise = (async () => {
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass }
        });
    })();
    return transporterPromise;
}

async function sendMail({ to, subject, text, html, from }) {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
        from: from || config.mail?.from || `no-reply@localhost`,
        to,
        subject,
        text,
        html
    });
    return info;
}

module.exports = { sendMail, createTransporter };
