const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendCampaignEmail(campaign, subscriber, step) {
    try {
      // Replace variables in email content
      const subject = this.replaceVariables(step.emailTemplate.subject, subscriber);
      const htmlBody = this.replaceVariables(step.emailTemplate.htmlBody, subscriber);
      const textBody = this.replaceVariables(step.emailTemplate.body, subscriber);

      const result = await this.sendEmail(
        subscriber.email,
        subject,
        htmlBody,
        textBody
      );

      return result;
    } catch (error) {
      console.error('Campaign email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  replaceVariables(content, subscriber) {
    if (!content) return '';

    return content
      .replace(/\{\{user\.name\}\}/g, subscriber.firstName || 'User')
      .replace(/\{\{user\.email\}\}/g, subscriber.email)
      .replace(/\{\{user\.company\}\}/g, subscriber.customFields?.company || '')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{unsubscribe\.url\}\}/g, `${process.env.CLIENT_URL}/unsubscribe?email=${subscriber.email}`)
      .replace(/\{\{tracking\.url\}\}/g, `${process.env.CLIENT_URL}/track?email=${subscriber.email}`);
  }

  async sendTestEmail(to, campaign, step) {
    try {
      const testSubscriber = {
        email: to,
        firstName: 'Test',
        customFields: { company: 'Test Company' }
      };

      return await this.sendCampaignEmail(campaign, testSubscriber, step);
    } catch (error) {
      console.error('Test email sending failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService(); 