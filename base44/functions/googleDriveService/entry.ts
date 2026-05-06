import { createClient } from 'npm:@base44/sdk@0.8.25';

// Drive layer for MRT. Folder convention: MRT/Trips/<YYYY-MM-DD>/<trip_id>/<doc_type>
// Same shape as peer apps. Wraps Google Drive REST v3.
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action } = body;
    if (!action) return Response.json({ error: 'action required' }, { status: 400 });

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return Response.json({ error: 'Drive not configured' }, { status: 503 });
    }

    switch (action) {
      case 'ensure_folder': {
        const { trip_id, doc_type, date } = body;
        if (!trip_id || !doc_type) {
          return Response.json({ error: 'trip_id and doc_type required' }, { status: 400 });
        }
        const dateStr = date || new Date().toISOString().slice(0, 10);
        const folderId = await ensureFolderPath(accessToken, ['MRT', 'Trips', dateStr, trip_id, doc_type]);
        return Response.json({ success: true, folder_id: folderId });
      }
      case 'copy_template': {
        const { template_file_id, new_name, parent_folder_id } = body;
        if (!template_file_id || !new_name) {
          return Response.json({ error: 'template_file_id and new_name required' }, { status: 400 });
        }
        const copy = await driveFetch(accessToken, `/files/${template_file_id}/copy`, {
          method: 'POST',
          body: JSON.stringify({
            name: new_name,
            parents: parent_folder_id ? [parent_folder_id] : undefined,
          }),
        });
        return Response.json({ success: true, file_id: copy.id, file_url: copy.webViewLink || null });
      }
      case 'replace_placeholders': {
        const { file_id, replacements } = body;
        if (!file_id || !replacements) {
          return Response.json({ error: 'file_id and replacements required' }, { status: 400 });
        }
        const requests = Object.entries(replacements).map(([k, v]) => ({
          replaceAllText: {
            containsText: { text: `{{${k}}}`, matchCase: false },
            replaceText: String(v ?? ''),
          },
        }));
        const docsRes = await fetch(`https://docs.googleapis.com/v1/documents/${file_id}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        });
        if (!docsRes.ok) {
          const t = await docsRes.text();
          return Response.json({ error: `docs_api: ${t}` }, { status: 502 });
        }
        return Response.json({ success: true });
      }
      case 'get_file': {
        const { file_id } = body;
        const file = await driveFetch(
          accessToken,
          `/files/${file_id}?fields=id,name,webViewLink,parents,mimeType`
        );
        return Response.json({ success: true, file });
      }
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
});

async function getAccessToken(): Promise<string | null> {
  // Service account flow. Same env vars as peer apps.
  const clientEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = (Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || '').replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const header = { alg: 'RS256', typ: 'JWT' };
  const enc = (o: any) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsigned = `${enc(header)}.${enc(claim)}`;

  const pem = privateKey.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  );
  const sigB64 = btoa(String.fromCharCode(...sig))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const jwt = `${unsigned}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!tokenRes.ok) return null;
  const json = await tokenRes.json();
  return json.access_token || null;
}

async function driveFetch(accessToken: string, path: string, init: RequestInit = {}) {
  const url = `https://www.googleapis.com/drive/v3${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`drive ${res.status}: ${await res.text()}`);
  return res.json();
}

async function ensureFolderPath(accessToken: string, segments: string[]): Promise<string> {
  let parent = 'root';
  for (const name of segments) {
    const q = encodeURIComponent(
      `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false`
    );
    const list = await driveFetch(accessToken, `/files?q=${q}&fields=files(id,name)`);
    if (list.files && list.files.length > 0) {
      parent = list.files[0].id;
    } else {
      const created = await driveFetch(accessToken, `/files`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parent],
        }),
      });
      parent = created.id;
    }
  }
  return parent;
}
