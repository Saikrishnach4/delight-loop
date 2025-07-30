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
  addTrackingToEmail(emailContent, campaignId, userEmail, baseUrl = null, campaignData = null) {
    try {
      // Use environment variable or default to Render domain
      const trackingBaseUrl = baseUrl || process.env.BASE_URL || 'https://delight-loop.onrender.com';
      const encodedEmail = encodeURIComponent(userEmail);
      const trackingPixelUrl = `${trackingBaseUrl}/api/campaigns/track/open/${campaignId}/${encodedEmail}`;
      const clickTrackingUrl = `${trackingBaseUrl}/api/campaigns/track/click/${campaignId}/${encodedEmail}`;
      const purchaseUrl = `${trackingBaseUrl}/api/campaigns/purchase/${campaignId}/${encodedEmail}`;
      
      console.log('🔍 ADDING TRACKING TO EMAIL:');
      console.log(`📧 Campaign ID: ${campaignId}`);
      console.log(`📧 User Email: ${userEmail}`);
      console.log(`📧 BASE_URL from env: ${process.env.BASE_URL || 'NOT SET'}`);
      console.log(`📧 Using tracking base URL: ${trackingBaseUrl}`);
      console.log(`📧 Tracking URL: ${trackingPixelUrl}`);
      console.log(`📧 Click Tracking URL: ${clickTrackingUrl}`);
      console.log(`📧 Purchase URL: ${purchaseUrl}`);
      
      let htmlContent = emailContent;
      
      // Add tracking pixel at the end of the email
      const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
      
      // Add tracking pixel to HTML content
      if (!htmlContent.includes('</body>')) {
        htmlContent += trackingPixel;
        console.log('📧 Added tracking pixel to end of content (no </body> tag)');
      } else {
        htmlContent = htmlContent.replace('</body>', `${trackingPixel}</body>`);
        console.log('📧 Added tracking pixel before </body> tag');
      }
      
      // Enhanced click tracking: Replace ALL URLs with recipient-specific tracking
      // This includes both <a href> tags and plain text URLs
      
      // 1. Replace <a href> tags with tracking
      htmlContent = htmlContent.replace(
        /<a\s+href="([^"]+)"/gi,
        (match, url) => {
          const encodedUrl = encodeURIComponent(url);
          console.log(`📧 Modified <a> link: ${url} -> ${clickTrackingUrl}?url=${encodedUrl}`);
          return `<a href="${clickTrackingUrl}?url=${encodedUrl}"`;
        }
      );
      
      // 2. Replace manual tracking links (if user pasted them)
      // Look for patterns like: http://localhost:5000/api/campaigns/track/click/CAMPAIGN_ID/RECIPIENT_EMAIL?url=...
      const manualTrackingPattern = new RegExp(
        `${trackingBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/api/campaigns/track/click/[^/]+/[^?\\s]+\\?url=([^"\\s]+)`,
        'gi'
      );
      
      htmlContent = htmlContent.replace(manualTrackingPattern, (match, originalUrl) => {
        const encodedUrl = encodeURIComponent(originalUrl);
        const newTrackingUrl = `${clickTrackingUrl}?url=${encodedUrl}`;
        console.log(`📧 Replaced manual tracking link: ${match} -> ${newTrackingUrl}`);
        return newTrackingUrl;
      });
      
      // 3. Replace plain text URLs (http/https) that are not already in <a> tags
      // This is more complex - we need to avoid URLs that are already in href attributes
      const plainUrlPattern = /(?<!["'])(https?:\/\/[^\s<>"']+)(?!["'])/gi;
      htmlContent = htmlContent.replace(plainUrlPattern, (match, url) => {
        // Check if this URL is already inside an <a> tag
        const beforeMatch = htmlContent.substring(0, htmlContent.indexOf(match));
        const afterMatch = htmlContent.substring(htmlContent.indexOf(match) + match.length);
        
        // Simple check: if there's a <a before and </a> after, skip it
        const lastATag = beforeMatch.lastIndexOf('<a>');
        const nextCloseTag = afterMatch.indexOf('</a>');
        
        if (lastATag > -1 && nextCloseTag > -1) {
          // This URL is likely already in an <a> tag, skip it
          return match;
        }
        
        const encodedUrl = encodeURIComponent(url);
        const newTrackingUrl = `${clickTrackingUrl}?url=${encodedUrl}`;
        console.log(`📧 Modified plain text URL: ${url} -> ${newTrackingUrl}`);
        return newTrackingUrl;
      });

      // 4. Add purchase button for purchase campaigns
      // Check if this is a purchase campaign by looking for campaign data or specific keywords
      const isPurchaseCampaign = campaignData?.purchaseCampaignType && campaignData.purchaseCampaignType !== 'none';
      const hasPurchaseButton = htmlContent.includes('purchase-button') || htmlContent.includes('Purchase Now');
      
      console.log('🔍 Purchase button check:', {
        isPurchaseCampaign,
        hasPurchaseButton,
        campaignData: campaignData,
        contentLength: htmlContent.length
      });
      
      if (isPurchaseCampaign && !hasPurchaseButton) {
        // Use campaign data for custom purchase button text and amount
        const purchaseLinkText = campaignData?.purchaseLinkText || '🛒 Purchase Now - $99.99';
        const purchaseAmount = campaignData?.purchaseAmount || 99.99;
        
        const purchaseButton = `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${clickTrackingUrl}?url=${encodeURIComponent(purchaseUrl)}" style="
              display: inline-block;
              background: linear-gradient(45deg, #2ecc71, #27ae60);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 50px;
              font-size: 16px;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
            ">
              ${purchaseLinkText.replace('$99.99', `$${purchaseAmount}`)}
            </a>
          </div>
        `;
        
        // Add purchase button before the tracking pixel
        if (!htmlContent.includes('</body>')) {
          htmlContent += purchaseButton;
        } else {
          htmlContent = htmlContent.replace('</body>', `${purchaseButton}</body>`);
        }
        
        console.log('📧 Added purchase button to purchase campaign email');
      } else if (!isPurchaseCampaign && !htmlContent.includes('purchase') && !htmlContent.includes('buy') && !htmlContent.includes('order')) {
        // For non-purchase campaigns, add purchase button only if no purchase-related content exists
        const purchaseButton = `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${clickTrackingUrl}?url=${encodeURIComponent(purchaseUrl)}" style="
              display: inline-block;
              background: linear-gradient(45deg, #2ecc71, #27ae60);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 50px;
              font-size: 16px;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
            ">
              🛒 Purchase Now - $99.99
            </a>
          </div>
        `;
        
        // Add purchase button before the tracking pixel
        if (!htmlContent.includes('</body>')) {
          htmlContent += purchaseButton;
        } else {
          htmlContent = htmlContent.replace('</body>', `${purchaseButton}</body>`);
        }
        
        console.log('📧 Added purchase button to regular email');
      }
      
      console.log('✅ Enhanced tracking added to email content successfully');
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