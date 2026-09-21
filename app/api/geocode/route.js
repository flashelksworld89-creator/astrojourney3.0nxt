import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ error: 'Enter a location.' }, { status: 400 });

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AstroWalkJourney/3.7.2',
        'Accept-Language': 'en',
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Fallback geocoder returned ${response.status}`);
    const results = await response.json();
    const r = Array.isArray(results) ? results[0] : null;
    if (!r) return NextResponse.json({ error: 'No matching location was found.' }, { status: 404 });

    return NextResponse.json({
      lat: Number(r.lat),
      lng: Number(r.lon),
      label: r.display_name || q,
      source: 'nominatim',
    });
  } catch {
    return NextResponse.json({ error: 'Location lookup is temporarily unavailable.' }, { status: 503 });
  }
}
