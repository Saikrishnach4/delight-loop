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