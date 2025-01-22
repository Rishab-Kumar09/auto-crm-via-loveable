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
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')

    if (adminError) {
      console.error('Error fetching admin users:', adminError)
      throw adminError
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.warn('No admin users found')
      return new Response(
        JSON.stringify({ message: 'No admin users found to notify' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const { ticket } = await req.json()
    console.log('Processing ticket notification:', ticket)

    // Send email to all admins
    const emailPromises = adminUsers.map(async (admin) => {
      if (!admin.email) {
        console.warn('Admin user has no email:', admin)
        return
      }

      try {
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
              <hr>
              <p>Please login to the support dashboard to review this ticket and set its priority.</p>
            `,
          }),
        })

        if (!res.ok) {
          const errorText = await res.text()
          console.error(`Failed to send email to ${admin.email}:`, errorText)
          throw new Error(`Resend API error: ${errorText}`)
        }

        const data = await res.json()
        console.log(`Email sent successfully to ${admin.email}:`, data)
      } catch (error) {
        console.error(`Error sending email to ${admin.email}:`, error)
        throw error
      }
    })

    try {
      await Promise.all(emailPromises.filter(Boolean))
    } catch (error) {
      console.error('Error sending emails:', error)
      throw new Error('Failed to send one or more notification emails')
    }

    return new Response(
      JSON.stringify({ message: 'Notifications sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in notify-ticket function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})