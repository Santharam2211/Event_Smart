const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async ({ to, subject, htmlContent }) => {
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'your_brevo_api_key') {
        console.log('Email simulated:', { to, subject });
        return;
    }

    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { name: "EventSmart", email: process.env.EMAIL_FROM || "noreply@eventsmart.com" };
        sendSmtpEmail.to = [{ email: to }];

        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
        console.error('Email failed:', error);
    }
};

module.exports = { sendEmail };
