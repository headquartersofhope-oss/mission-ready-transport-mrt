import { createClient } from 'npm:@base44/sdk@0.8.25';

// Generates a document from a DocumentTemplate by copying its drive_template_id
// into MRT/Trips/<date>/<trip_id>/<doc_type>/, then replacing placeholders.
// Records a GeneratedDocument row.
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { template_id, source_entity_type, source_entity_id, extra_replacements } = body;
    if (!template_id || !source_entity_type || !source_entity_id) {
      return Response.json(
        { error: 'template_id, source_entity_type, source_entity_id required' },
        { status: 400 }
      );
    }

    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID') || '',
      apiKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') || '',
    });

    const template = await base44.entities.DocumentTemplate.get(template_id);
    if (!template || !template.enabled) {
      return Response.json({ error: 'Template missing or disabled' }, { status: 404 });
    }
    if (!template.drive_template_id) {
      return Response.json({ error: 'Template has no drive_template_id' }, { status: 400 });
    }

    const entityClient = base44.entities[source_entity_type];
    if (!entityClient) {
      return Response.json({ error: `Unknown entity ${source_entity_type}` }, { status: 400 });
    }
    const source = await entityClient.get(source_entity_id);
    if (!source) return Response.json({ error: 'Source entity not found' }, { status: 404 });

    // Date + trip key
    let date = new Date().toISOString().slice(0, 10);
    let tripIdForFolder = source_entity_id;
    if (source_entity_type === 'TransportRequest') {
      date = source.request_date || date;
      tripIdForFolder = source.id;
    } else if (source_entity_type === 'Incident') {
      date = source.incident_date || date;
      tripIdForFolder = source.ride_request_id || source.id;
    }

    // Drive: ensure folder + copy template
    const ensureRes = await callDrive({
      action: 'ensure_folder',
      trip_id: tripIdForFolder,
      doc_type: template.document_type,
      date,
    });
    if (!ensureRes.success) {
      return Response.json({ error: 'drive ensure_folder failed' }, { status: 502 });
    }
    const folderId = ensureRes.folder_id;

    const newName = `${template.template_name} - ${tripIdForFolder} - ${date}`;
    const copyRes = await callDrive({
      action: 'copy_template',
      template_file_id: template.drive_template_id,
      new_name: newName,
      parent_folder_id: folderId,
    });
    if (!copyRes.success) {
      return Response.json({ error: 'drive copy_template failed' }, { status: 502 });
    }

    // Build replacements from mapping_json
    const replacements: Record<string, any> = {};
    const mapping = template.mapping_json || {};
    for (const [placeholder, sourceField] of Object.entries(mapping)) {
      replacements[placeholder] = source[sourceField as string] ?? '';
    }
    if (extra_replacements && typeof extra_replacements === 'object') {
      Object.assign(replacements, extra_replacements);
    }

    if (Object.keys(replacements).length > 0) {
      await callDrive({ action: 'replace_placeholders', file_id: copyRes.file_id, replacements });
    }

    const generated = await base44.entities.GeneratedDocument.create({
      template_id,
      source_entity_type,
      source_entity_id,
      global_resident_id:
        source.pathways_global_resident_id || null,
      drive_file_id: copyRes.file_id,
      drive_file_url: copyRes.file_url,
      drive_folder_id: folderId,
      signature_status: 'not_required',
      audit_chain: [
        {
          event: 'generated',
          at: new Date().toISOString(),
          template_id,
          source_entity_type,
          source_entity_id,
        },
      ],
    });

    return Response.json({ success: true, generated_document: generated });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
});

async function callDrive(payload: any) {
  const driveUrl = Deno.env.get('MRT_FUNCTIONS_BASE_URL')
    ? `${Deno.env.get('MRT_FUNCTIONS_BASE_URL')!.replace(/\/$/, '')}/functions/googleDriveService`
    : null;
  if (!driveUrl) {
    return { success: false, error: 'MRT_FUNCTIONS_BASE_URL not set' };
  }
  const res = await fetch(driveUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
