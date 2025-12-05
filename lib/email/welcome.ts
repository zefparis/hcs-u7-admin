/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { sendAppEmail } from "./resend";

export interface WelcomeEmailParams {
  to: string;
  fullName: string;
  company: string | null;
  dashboardUrl: string;
  login: string;
  password: string;
  hasHcsCode: boolean;
  trialDays: number;
  plan: string;
  monthlyQuota: number;
}

/**
 * Send welcome email to newly approved tenant with their credentials
 */
export async function sendWelcomeEmail({
  to,
  fullName,
  company,
  dashboardUrl,
  login,
  password,
  hasHcsCode,
  trialDays,
  plan,
  monthlyQuota,
}: WelcomeEmailParams) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HCS-U7</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .header p { margin: 0; opacity: 0.9; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .credentials { background: white; padding: 20px; border-radius: 8px; 
                  border-left: 4px solid #667eea; margin: 20px 0; }
    .credential-item { margin: 12px 0; }
    .credential-label { font-weight: bold; color: #667eea; display: block; margin-bottom: 4px; }
    .credential-value { font-family: 'Courier New', monospace; background: #f0f0f0; 
                       padding: 8px 12px; border-radius: 4px; display: inline-block; 
                       word-break: break-all; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; 
              padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning strong { color: #856404; }
    .warning ul { margin: 10px 0 0 0; padding-left: 20px; }
    .warning li { margin: 5px 0; }
    .cta { background: #667eea; color: white !important; padding: 15px 30px; 
          text-decoration: none; border-radius: 6px; display: inline-block; 
          margin: 20px 0; font-weight: bold; }
    .cta:hover { background: #5a6fd6; }
    .footer { text-align: center; color: #666; font-size: 12px; 
             margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .footer a { color: #667eea; }
    .plan-badge { display: inline-block; background: #667eea; color: white; 
                 padding: 4px 12px; border-radius: 20px; font-size: 12px; 
                 font-weight: bold; margin-left: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to HCS-U7!</h1>
      <p>Your account has been activated</p>
    </div>
    
    <div class="content">
      <p>Hello <strong>${fullName}</strong>${company ? ` from <strong>${company}</strong>` : ""},</p>
      
      <p>Great news! Your HCS-U7 account has been approved and is now ready to use. 
         Below are your credentials to access the dashboard:</p>
      
      <div class="credentials">
        <div class="credential-item">
          <span class="credential-label">Dashboard URL:</span>
          <span class="credential-value">${dashboardUrl}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Email:</span>
          <span class="credential-value">${login}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Temporary Password:</span>
          <span class="credential-value">${password}</span>
        </div>
        ${hasHcsCode ? `
        <div class="credential-item">
          <span class="credential-label">HCS-U7 Code:</span>
          <span class="credential-value">Use the code you generated during signup</span>
        </div>
        ` : ""}
      </div>
      
      <div class="warning">
        <strong>⚠️ Important Security Information:</strong>
        <ul>
          <li>You'll be prompted to <strong>change your password</strong> on first login</li>
          ${hasHcsCode ? "<li>Keep your <strong>HCS-U7 code</strong> safe - you need it for every login (cognitive 2FA)</li>" : ""}
          <li>Your trial period: <strong>${trialDays} days</strong></li>
          <li>Plan: <strong>${plan}</strong> <span class="plan-badge">${monthlyQuota.toLocaleString()} req/month</span></li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${dashboardUrl}/login" class="cta">Login to Dashboard →</a>
      </div>
      
      <p style="margin-top: 30px;">Once logged in, you can:</p>
      <ul>
        <li>Generate API keys for your applications</li>
        <li>Monitor your usage and quotas</li>
        <li>Access documentation and integration guides</li>
        <li>Manage your account settings</li>
      </ul>
      
      <p>Need help getting started? Check out our 
         <a href="https://docs.hcs-u7.tech" style="color: #667eea;">documentation</a> 
         or contact our support team.</p>
    </div>
    
    <div class="footer">
      <p><strong>HCS-U7 - Human Cognitive Signature</strong><br>
      © 2025 IA Solution | Patent Pending FR2514274 & FR2514546</p>
      <p>Need help? <a href="mailto:support@hcs-u7.tech">support@hcs-u7.tech</a></p>
      <p style="font-size: 11px; color: #999; margin-top: 15px;">
        This email was sent to ${to} because you requested access to HCS-U7.<br>
        If you didn't request this, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendAppEmail({
    to,
    subject: `Welcome to HCS-U7 - Your Account is Ready 🎉`,
    html,
  });
}

export interface RejectionEmailParams {
  to: string;
  fullName: string;
  company: string;
  reason?: string;
}

/**
 * Send rejection email to prospect (optional)
 */
export async function sendRejectionEmail({
  to,
  fullName,
  company,
  reason,
}: RejectionEmailParams) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HCS-U7 Access Request Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; 
              border-bottom: 3px solid #667eea; }
    .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; 
               border: 1px solid #e9ecef; border-top: none; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; color: #333;">HCS-U7 Access Request</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${fullName}</strong> from <strong>${company}</strong>,</p>
      
      <p>Thank you for your interest in HCS-U7. After reviewing your access request, 
         we regret to inform you that we are unable to approve your application at this time.</p>
      
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      
      <p>If you believe this decision was made in error or if you have additional information 
         that might help us reconsider, please don't hesitate to contact us at 
         <a href="mailto:support@hcs-u7.tech" style="color: #667eea;">support@hcs-u7.tech</a>.</p>
      
      <p>We appreciate your understanding.</p>
      
      <p>Best regards,<br>The HCS-U7 Team</p>
    </div>
    
    <div class="footer">
      <p>© 2025 IA Solution | HCS-U7 - Human Cognitive Signature</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendAppEmail({
    to,
    subject: `HCS-U7 Access Request Update`,
    html,
  });
}

export interface StripePaymentEmailParams {
  to: string;
  fullName: string;
  company: string;
  plan: string;
  price: number;
  checkoutUrl: string;
}

/**
 * Send email with Stripe payment link
 */
export async function sendStripePaymentEmail({
  to,
  fullName,
  company,
  plan,
  price,
  checkoutUrl,
}: StripePaymentEmailParams) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Access Request is Approved!</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .cta { background: #667eea; color: white !important; padding: 15px 40px; 
          text-decoration: none; border-radius: 6px; display: inline-block; 
          margin: 20px 0; font-weight: bold; font-size: 18px; }
    .cta:hover { background: #5a6fd6; }
    .info-box { background: white; padding: 20px; border-radius: 8px; 
               border-left: 4px solid #667eea; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; 
             margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .footer a { color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Access Request is Approved!</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${fullName}</strong>${company ? ` from <strong>${company}</strong>` : ''},</p>
      
      <p>Great news! Your request to access HCS-U7 has been approved by our team.</p>
      
      <div class="info-box">
        <h3>Selected Plan: ${plan}</h3>
        <p><strong>Price:</strong> €${price}/month</p>
        <p><strong>What's included:</strong> Advanced cognitive authentication, bot detection, and full API access.</p>
      </div>
      
      <p><strong>Next step:</strong> Complete your payment to activate your account instantly.</p>
      
      <div style="text-align: center;">
        <a href="${checkoutUrl}" class="cta">Complete Payment (€${price}/month)</a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        ⏰ This payment link expires in 24 hours.<br>
        🔒 Secure payment powered by Stripe.<br>
        💳 You'll receive your dashboard credentials immediately after payment.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>HCS-U7 - Human Cognitive Signature</strong><br>
      © 2025 IA Solution | Patent Pending FR2514274 & FR2514546</p>
      <p>Questions? <a href="mailto:support@hcs-u7.tech">support@hcs-u7.tech</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendAppEmail({
    to,
    subject: `✅ Access Approved - Complete Your Payment (€${price}/mo)`,
    html,
  });
}
