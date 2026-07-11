import type { APIRoute } from 'astro';
import { CONTACT_EMAIL, PARTNER_ONE, PARTNER_TWO, WEDDING_DATE_LABEL, WEDDING_VENUE } from '../../consts';

export const prerender = false;

async function sendConfirmationEmail(
	apiKey: string,
	to: string,
	details: { naam: string; aanwezig: string; aantalGasten: number },
) {
	const { naam, aanwezig, aantalGasten } = details;

	const body =
		aanwezig === 'ja'
			? `<p>Beste ${naam},</p>
			   <p>Bedankt voor je RSVP! We hebben genoteerd dat je met ${aantalGasten} perso(o)n(en) aanwezig zal zijn op ${WEDDING_DATE_LABEL} in ${WEDDING_VENUE}.</p>
			   <p>Tot dan!</p>
			   <p>${PARTNER_ONE} & ${PARTNER_TWO}</p>`
			: `<p>Beste ${naam},</p>
			   <p>Bedankt om ons te laten weten dat je er helaas niet bij kan zijn op ${WEDDING_DATE_LABEL}. Jammer, maar we begrijpen het!</p>
			   <p>${PARTNER_ONE} & ${PARTNER_TWO}</p>`;

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: `${PARTNER_ONE} & ${PARTNER_TWO} <${CONTACT_EMAIL}>`,
			to,
			subject: 'Bevestiging van je RSVP',
			html: body,
		}),
	});

	if (!response.ok) {
		throw new Error(`Resend API error: ${response.status} ${await response.text()}`);
	}
}

export const POST: APIRoute = async ({ request, redirect, locals }) => {
	const formData = await request.formData();

	const naam = String(formData.get('naam') ?? '').trim();
	const email = String(formData.get('email') ?? '').trim();
	const aanwezig = String(formData.get('aanwezig') ?? '').trim();
	const aantalGasten = Number(formData.get('aantal_gasten') ?? 1) || 1;
	const dieetwensen = String(formData.get('dieetwensen') ?? '').trim();
	const bericht = String(formData.get('bericht') ?? '').trim();

	if (!naam || !email || (aanwezig !== 'ja' && aanwezig !== 'nee')) {
		return redirect('/rsvp?status=error');
	}

	const { env, ctx } = locals.runtime;

	try {
		await env.DB.prepare(
			`INSERT INTO rsvps (naam, email, aanwezig, aantal_gasten, dieetwensen, bericht)
			 VALUES (?, ?, ?, ?, ?, ?)`,
		)
			.bind(naam, email, aanwezig, aantalGasten, dieetwensen || null, bericht || null)
			.run();
	} catch {
		return redirect('/rsvp?status=error');
	}

	ctx.waitUntil(
		sendConfirmationEmail(env.RESEND_API_KEY, email, { naam, aanwezig, aantalGasten }).catch((error) =>
			console.error('Failed to send RSVP confirmation email', error),
		),
	);

	return redirect('/rsvp?status=success');
};
