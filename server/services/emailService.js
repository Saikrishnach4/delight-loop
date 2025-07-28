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
      // Replace variables in email content with tracking
      const subject = this.replaceVariables(step.emailTemplate.subject, subscriber, campaign._id);
      const htmlBody = this.replaceVariables(step.emailTemplate.htmlBody, subscriber, campaign._id);
      const textBody = this.replaceVariables(step.emailTemplate.body, subscriber, campaign._id);

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

  replaceVariables(content, subscriber, campaignId = null) {
    if (!content) return '';

    let processedContent = content
      .replace(/\{\{user\.name\}\}/g, subscriber.firstName || 'User')
      .replace(/\{\{user\.email\}\}/g, subscriber.email)
      .replace(/\{\{user\.company\}\}/g, subscriber.customFields?.company || '')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());

    // Add tracking URLs if campaign ID is provided
    if (campaignId) {
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:5000';
      const trackingPixel = `<img src="${baseUrl}/api/tracking/pixel/${campaignId}/${encodeURIComponent(subscriber.email)}" width="1" height="1" style="display:none;" />`;
      const unsubscribeUrl = `${baseUrl}/api/tracking/unsubscribe/${campaignId}/${encodeURIComponent(subscriber.email)}`;
      
      processedContent = processedContent
        .replace(/\{\{unsubscribe\.url\}\}/g, unsubscribeUrl)
        .replace(/\{\{tracking\.pixel\}\}/g, trackingPixel);
      
      // Add tracking pixel to HTML content
      if (processedContent.includes('</body>')) {
        processedContent = processedContent.replace('</body>', `${trackingPixel}</body>`);
      } else {
        processedContent += trackingPixel;
      }
    } else {
      processedContent = processedContent
        .replace(/\{\{unsubscribe\.url\}\}/g, `${process.env.CLIENT_URL}/unsubscribe?email=${subscriber.email}`)
        .replace(/\{\{tracking\.url\}\}/g, `${process.env.CLIENT_URL}/track?email=${subscriber.email}`);
    }

    return processedContent;
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