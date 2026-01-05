import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  volunteerName: string;
  opportunityTitle: string;
  opportunityDate: string;
  opportunityTime: string;
  opportunityLocation: string;
  type: 'auto_approved' | 'approved' | 'rejected' | 'reminder';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      volunteerName, 
      opportunityTitle, 
      opportunityDate, 
      opportunityTime, 
      opportunityLocation,
      type 
    }: NotificationEmailRequest = await req.json();

    console.log(`Sending ${type} notification email to ${to}`);

    let subject: string;
    let htmlContent: string;

    switch (type) {
      case 'auto_approved':
        subject = `You've been auto-approved for: ${opportunityTitle}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 You're Approved!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px;">Dear <strong>${volunteerName}</strong>,</p>
              <p style="font-size: 16px;">Great news! Based on your course schedule, you've been automatically approved to participate in the following volunteer opportunity:</p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; color: #1f2937;">${opportunityTitle}</h2>
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${opportunityDate}</p>
                <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${opportunityTime}</p>
                <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${opportunityLocation}</p>
              </div>
              <p style="font-size: 16px;">Please make sure to arrive on time and bring any necessary materials.</p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Best regards,<br>Community Service & Development Center</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'approved':
        subject = `Application Approved: ${opportunityTitle}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ Application Approved</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px;">Dear <strong>${volunteerName}</strong>,</p>
              <p style="font-size: 16px;">Your application has been approved!</p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; color: #1f2937;">${opportunityTitle}</h2>
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${opportunityDate}</p>
                <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${opportunityTime}</p>
                <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${opportunityLocation}</p>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Best regards,<br>Community Service & Development Center</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'rejected':
        subject = `Application Update: ${opportunityTitle}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #6b7280; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px;">Dear <strong>${volunteerName}</strong>,</p>
              <p style="font-size: 16px;">Unfortunately, we were unable to approve your application for <strong>${opportunityTitle}</strong> at this time.</p>
              <p style="font-size: 16px;">Please don't be discouraged - there will be more opportunities available soon!</p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Best regards,<br>Community Service & Development Center</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'reminder':
        subject = `Reminder: ${opportunityTitle} is Tomorrow!`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Reminder</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px;">Dear <strong>${volunteerName}</strong>,</p>
              <p style="font-size: 16px;">This is a friendly reminder about your upcoming volunteer activity:</p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; color: #1f2937;">${opportunityTitle}</h2>
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${opportunityDate}</p>
                <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${opportunityTime}</p>
                <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${opportunityLocation}</p>
              </div>
              <p style="font-size: 16px;">Please arrive on time. We look forward to seeing you!</p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Best regards,<br>Community Service & Development Center</p>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Send email using Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Community Service <onboarding@resend.dev>",
        to: [to],
        subject,
        html: htmlContent,
      }),
    });

    const result = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-volunteer-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
