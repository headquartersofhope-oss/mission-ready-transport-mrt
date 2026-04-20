import Anthropic from 'npm:@anthropic-ai/sdk@0.24.0';

const client = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

const SYSTEM_CONTEXT = `You are the MRT Connect customer service and booking assistant. 
You help visitors understand and book transportation services with a friendly, helpful tone.

MRT Services Available:
- Passenger Transport: Safe, reliable rides for individuals and groups
- Specimen Delivery: Secure medical specimen transport throughout Austin TX
- Veteran Transport: Specialized transport for veteran community members

Service Area: Austin, Texas and surrounding areas
Hours: Monday-Friday 6 AM - 6 PM
Contact: support@mrt-connect.com | 512-555-0123

Your role:
- Answer questions about MRT services
- Help visitors understand passenger transport, specimen delivery, and veteran transport options
- Guide people through the booking process
- Collect name and contact info for booking inquiries
- Direct urgent needs to the MRT team
- Maintain a friendly, professional tone
- Be clear about what services are available

Do NOT:
- Discuss internal operational details or driver information
- Provide real-time tracking (not available to public)
- Promise specific pricing (direct to contact page)
- Share internal business processes

When collecting booking info, ask for:
1. Full name
2. Phone number
3. Email (optional but helpful)
4. Service type interest
5. General description of need`;

Deno.serve(async (req) => {
  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid request: messages array required' }, { status: 400 });
    }

    // Call Claude
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_CONTEXT,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const assistantMessage = response.content[0];
    if (assistantMessage.type !== 'text') {
      return Response.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    return Response.json({
      content: assistantMessage.text,
      stop_reason: response.stop_reason,
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});