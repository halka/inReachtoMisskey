import * as PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    env.MISSKEY_API_URL = env.MISSKEY_API_URL || '';
    env.MISSKEY_API_TOKEN = env.MISSKEY_API_TOKEN || '';
    const parser = new PostalMime.default();
    const rawEmail = new Response(message.raw);
    const email = await parser.parse(await rawEmail.arrayBuffer());
    let from = email.from.address;
    let body = email.text ?? '';
    let subject = email.subject ?? '';
    let bodyLines = body.split(/\r?\n/).filter(line => line.trim() !== '');
    let lat: string | null = null;
    let lon: string | null = null;
    let googlemapsUrl = 'https://maps.google.com/?q=';
    if (subject.includes('inReachメッセージ')) {
      for (const line of bodyLines) {
        const match = line.match(/Lat\s([0-9.\-]+)\sLon\s([0-9.\-]+)/);
        if (match) {
          lat = match[1];
          lon = match[2];
          googlemapsUrl += `${lat},${lon}`;
          break;
        }
      }
    } else {
      lat = null;
      lon = null;
    }
    console.log(from, bodyLines[0], lat, lon, googlemapsUrl);

    // Post to Misskey
    let note = "";
    if (lat && lon) {
      note = `${bodyLines[0]}\n${googlemapsUrl}`;
    } else {
      note = `${bodyLines[0]}`;
    }
    await fetch(env.MISSKEY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        i: env.MISSKEY_API_TOKEN,
        text: note,
      }),
    });
  },
};