import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Anthropic from 'npm:@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    const { documentType, entityData } = await req.json();

    let prompt = '';
    let documentTitle = '';

    if (documentType === 'trip_contract') {
      documentTitle = 'Transportation Service Agreement';
      prompt = `Generate a professional Texas-compliant Transportation Service Agreement document. Include:
- Service description and scope
- Payment terms
- Cancellation policy
- Liability limitations
- Participant responsibilities
- HOH Program-specific terms if applicable
- Data privacy notice (HIPAA)
- Emergency contact protocols

Entity data: ${JSON.stringify(entityData)}

Format as a professional legal document ready for printing and signature.`;
    } else if (documentType === 'driver_agreement') {
      documentTitle = 'Driver Independent Contractor Agreement';
      prompt = `Generate a Texas-compliant Driver Independent Contractor Agreement. Include:
- IC classification language per Texas law
- Vehicle and insurance requirements
- Hour restrictions
- Background check and licensing requirements
- Data protection and privacy obligations
- Emergency procedures
- Incident reporting requirements
- HOH program participant privacy requirements (HIPAA)
- Insurance liability
- Termination clauses

Entity data: ${JSON.stringify(entityData)}

Format as a professional legal document.`;
    } else if (documentType === 'hoh_authorization') {
      documentTitle = 'HOH Program Transport Authorization Form';
      prompt = `Generate an HOH Program Transportation Authorization form. Include:
- Participant identification and program details
- Service type authorization (client transport, medical delivery, etc.)
- HIPAA consent language
- Data sharing authorization with Pathways Hub
- Emergency contact information
- Special needs/accessibility accommodations
- Medical appointment privacy acknowledgment
- Driver information section
- Signature and date fields

Entity data: ${JSON.stringify(entityData)}

Format as a professional form ready for printing and signature.`;
    } else if (documentType === 'maintenance_log') {
      documentTitle = 'Vehicle Maintenance & Inspection Log';
      prompt = `Generate an IRS-compliant Vehicle Maintenance and Inspection Log template. Include:
- Vehicle identification (make, model, VIN, plate)
- Service date and odometer reading
- Service type (oil change, inspection, repair, etc.)
- Service provider and cost
- Next service due date
- Certification of work performed
- Inspector signature line
- Notes section for special repairs

Make it suitable for tracking business vehicle deductions.

Entity data: ${JSON.stringify(entityData)}

Format as a professional log/checklist form.`;
    } else if (documentType === 'incident_report') {
      documentTitle = 'Transportation Incident Report Form';
      prompt = `Generate a Texas Department of Transportation-compliant Incident Report form. Include:
- Incident date, time, and location
- Parties involved (driver, participant, third party)
- Vehicle information
- Incident description and cause
- Injuries or property damage
- Witnesses
- Police report number (if applicable)
- Photos/documentation references
- Immediate actions taken
- Recommendations for prevention
- Signature and date fields
- For workers' comp reporting

Entity data: ${JSON.stringify(entityData)}

Format as a professional incident form ready for print and filing.`;
    } else {
      return Response.json({ error: 'Unknown document type' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const documentContent = message.content[0].type === 'text' ? message.content[0].text : '';

    return Response.json({
      success: true,
      documentType,
      documentTitle,
      content: documentContent,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Document generation error:', error);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});