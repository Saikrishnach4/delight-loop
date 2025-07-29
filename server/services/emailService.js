const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      console.log('🔧 Initializing email transporter...');
      console.log('📧 Email config check:', {
        EMAIL_SERVICE: process.env.EMAIL_SERVICE,
        EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
        EMAIL_FROM: process.env.EMAIL_FROM
      });

      // Check if required email configuration exists
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Email configuration missing: EMAIL_USER and EMAIL_PASS are required');
        console.error('Current env vars:', {
          EMAIL_USER: process.env.EMAIL_USER,
          EMAIL_PASS: process.env.EMAIL_PASS ? '***' : 'NOT SET'
        });
        return;
      }

      // Determine email service configuration
      let emailConfig = {};

      // If EMAIL_SERVICE is set to gmail, use Gmail configuration
      if (process.env.EMAIL_SERVICE === 'gmail') {
        console.log('📧 Using Gmail service configuration');
        emailConfig = {
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        };
      } else {
        console.log('📧 Using custom SMTP configuration');
        // Use custom SMTP configuration
        emailConfig = {
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        };
      }

      console.log('📧 Creating transporter with config:', {
        service: emailConfig.service || 'custom smtp',
        host: emailConfig.host,
        port: emailConfig.port,
        user: emailConfig.auth.user
      });

      // Create transporter using the correct method
      this.transporter = nodemailer.createTransport(emailConfig);

      console.log('✅ Email transporter initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing email transporter:', error);
      this.transporter = null;
    }
  }

  async sendEmail(emailData) {
    try {
      if (!this.transporter) {
        console.error('❌ Transporter is null - checking initialization...');
        this.initializeTransporter(); // Try to initialize again
        
        if (!this.transporter) {
          throw new Error('Email transporter not initialized - check your EMAIL_USER and EMAIL_PASS configuration');
        }
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body,
        html: emailData.body // You can also send HTML emails
      };

      console.log('📧 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  // Add tracking to email content
  addTrackingToEmail(emailContent, campaignId, userEmail, baseUrl = null) {
    try {
      // Use environment variable or default to localhost
      const trackingBaseUrl = baseUrl || process.env.BASE_URL || 'http://localhost:5000';
      const encodedEmail = encodeURIComponent(userEmail);
      const trackingPixelUrl = `${trackingBaseUrl}/api/campaigns/track/open/${campaignId}/${encodedEmail}`;
      
      console.log('🔍 ADDING TRACKING TO EMAIL:');
      console.log(`📧 Campaign ID: ${campaignId}`);
      console.log(`📧 User Email: ${userEmail}`);
      console.log(`📧 BASE_URL from env: ${process.env.BASE_URL || 'NOT SET'}`);
      console.log(`📧 Using tracking base URL: ${trackingBaseUrl}`);
      console.log(`📧 Tracking URL: ${trackingPixelUrl}`);
      
      // Add tracking pixel at the end of the email
      const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
      
      // Add tracking pixel to HTML content
      let htmlContent = emailContent;
      if (!htmlContent.includes('</body>')) {
        htmlContent += trackingPixel;
        console.log('📧 Added tracking pixel to end of content (no </body> tag)');
      } else {
        htmlContent = htmlContent.replace('</body>', `${trackingPixel}</body>`);
        console.log('📧 Added tracking pixel before </body> tag');
      }
      
      // Add click tracking to links (simple version)
      const clickTrackingUrl = `${trackingBaseUrl}/api/campaigns/track/click/${campaignId}/${encodedEmail}`;
      htmlContent = htmlContent.replace(
        /<a\s+href="([^"]+)"/gi,
        (match, url) => {
          const encodedUrl = encodeURIComponent(url);
          console.log(`📧 Modified link: ${url} -> ${clickTrackingUrl}?url=${encodedUrl}`);
          return `<a href="${clickTrackingUrl}?url=${encodedUrl}"`;
        }
      );
      
      console.log('✅ Tracking added to email content successfully');
      return htmlContent;
    } catch (error) {
      console.error('❌ Error adding tracking to email:', error);
      return emailContent; // Return original content if tracking fails
    }
  }

  async verifyConnection() {
    try {
      if (!this.transporter) {
        console.log('❌ Email transporter not initialized');
        return false;
      }
      
      await this.transporter.verify();
      console.log('✅ Email connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email connection verification failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService(); 