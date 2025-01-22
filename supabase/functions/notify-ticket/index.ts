import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')

    if (adminError) throw adminError

    const { ticket } = await req.json()

    // Send email to all admins
    const emailPromises = adminUsers.map(async (admin) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Support System <onboarding@resend.dev>',
          to: admin.email,
          subject: `New Ticket Created: ${ticket.title}`,
          html: `
            <h2>New Support Ticket Created</h2>
            <p><strong>Title:</strong> ${ticket.title}</p>
            <p><strong>Description:</strong> ${ticket.description}</p>
            <p><strong>Company:</strong> ${ticket.company?.name || 'N/A'}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <hr>
            <p>Please login to the support dashboard to assign this ticket to an agent.</p>
          `,
        }),
      })

      if (!res.ok) {
        const error = await res.text()
        console.error('Error sending email:', error)
        throw new Error(`Failed to send email to ${admin.email}`)
      }
    })

    await Promise.all(emailPromises)

    return new Response(
      JSON.stringify({ message: 'Notification sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})