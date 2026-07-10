import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, locals }) => {
	const formData = await request.formData();

	const naam = String(formData.get('naam') ?? '').trim();
	const email = String(formData.get('email') ?? '').trim();
	const aanwezig = String(formData.get('aanwezig') ?? '').trim();
	const aantalGasten = Number(formData.get('aantal_gasten') ?? 1) || 1;
	const dieetwensen = String(formData.get('dieetwensen') ?? '').trim();
	const bericht = String(formData.get('bericht') ?? '').trim();

	if (!naam || (aanwezig !== 'ja' && aanwezig !== 'nee')) {
		return redirect('/rsvp?status=error');
	}

	const db = locals.runtime.env.DB;

	try {
		await db
			.prepare(
				`INSERT INTO rsvps (naam, email, aanwezig, aantal_gasten, dieetwensen, bericht)
				 VALUES (?, ?, ?, ?, ?, ?)`,
			)
			.bind(naam, email || null, aanwezig, aantalGasten, dieetwensen || null, bericht || null)
			.run();
	} catch {
		return redirect('/rsvp?status=error');
	}

	return redirect('/rsvp?status=success');
};
