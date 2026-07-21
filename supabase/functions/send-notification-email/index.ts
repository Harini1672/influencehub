import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@influencehub.io'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://influencehub.io'

interface EmailPayload {
  to: string
  type: 'request_received' | 'request_accepted' | 'request_rejected' | 'campaign_completed'
  data: {
    recipient_name: string
    sender_name: string
    campaign_title: string
    campaign_id: string
    budget?: number
    deadline?: string
    message?: string
  }
}

const templates: Record<EmailPayload['type'], (d: EmailPayload['data']) => { subject: string; html: string }> = {
  request_received: (d) => ({
    subject: `New Collaboration Request: ${d.campaign_title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Collaboration Request!</h1>
        </div>
        <p>Hi <strong>${d.recipient_name}</strong>,</p>
        <p><strong>${d.sender_name}</strong> wants to collaborate with you on <strong>"${d.campaign_title}"</strong>.</p>
        ${d.budget ? `<p>💰 Budget: <strong>$${d.budget.toLocaleString()}</strong></p>` : ''}
        ${d.deadline ? `<p>📅 Deadline: <strong>${new Date(d.deadline).toLocaleDateString()}</strong></p>` : ''}
        ${d.message ? `<p>💬 Message: <em>${d.message}</em></p>` : ''}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/influencer/requests" style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
            View Request
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">InfluenceHub · Unsubscribe</p>
      </div>
    `,
  }),

  request_accepted: (d) => ({
    subject: `🎉 ${d.sender_name} accepted your collaboration request!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Request Accepted! 🎉</h1>
        </div>
        <p>Hi <strong>${d.recipient_name}</strong>,</p>
        <p>Great news! <strong>${d.sender_name}</strong> has accepted your collaboration request for <strong>"${d.campaign_title}"</strong>.</p>
        <p>The campaign is now in progress. Head to your dashboard to communicate and track progress.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/brand/campaigns/${d.campaign_id}" style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
            View Campaign
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">InfluenceHub</p>
      </div>
    `,
  }),

  request_rejected: (d) => ({
    subject: `Update on your collaboration request for "${d.campaign_title}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <p>Hi <strong>${d.recipient_name}</strong>,</p>
        <p>${d.sender_name} has declined the collaboration request for <strong>"${d.campaign_title}"</strong>.</p>
        <p>Don't worry — there are many other talented creators on InfluenceHub waiting to collaborate.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/brand/browse" style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
            Browse Influencers
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">InfluenceHub</p>
      </div>
    `,
  }),

  campaign_completed: (d) => ({
    subject: `Campaign Completed: ${d.campaign_title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Campaign Completed! ✅</h1>
        </div>
        <p>Hi <strong>${d.recipient_name}</strong>,</p>
        <p>The campaign <strong>"${d.campaign_title}"</strong> has been marked as completed.</p>
        <p>Thank you for using InfluenceHub. We hope the collaboration was successful!</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}" style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
            Go to Dashboard
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">InfluenceHub</p>
      </div>
    `,
  }),
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload: EmailPayload = await req.json()
    const template = templates[payload.type](payload.data)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: template.subject,
        html: template.html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
