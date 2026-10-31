import { env } from 'cloudflare:workers';
import { business, fullAddress } from '~/business.config';
import { firstName, formatPrice } from '~/lib/format';
import { formatDate, formatTime } from '~/lib/schedule';
import { hitRateLimit } from '~/server/rate-limit';
import type { Db } from '~/server/rate-limit';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export type MailStatus = 'sent' | 'failed' | 'skipped';

// These domains can never receive mail. Sending to them from the published app
// would bounce, and bounces can pause the project's email.
const undeliverable = /\.(example|test|invalid|localhost)$/i;

async function deliver(
  db: Db,
  message: {
    to: string;
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
  }
): Promise<MailStatus> {
  if (!import.meta.env.DEV && undeliverable.test(message.to)) {
    console.warn(`[email] skipped: ${message.to} cannot receive mail`);
    return 'skipped';
  }

  // A hard stop for the day, so abuse of a public form can't drain the
  // project's email allowance or hurt its sender reputation.
  const budget = await hitRateLimit(
    db,
    `email:day:${new Date().toISOString().slice(0, 10)}`,
    business.limits.emailsPerDay,
    86_400
  );
  if (!budget.allowed) {
    console.warn('[email] skipped: daily budget used');
    return 'skipped';
  }

  const { error } = await env.EMAIL.send(message);
  if (error) {
    console.warn(`[email] ${error.code}: ${error.message}`);
    return 'failed';
  }
  return 'sent';
}

function layout(preheader: string, body: string, siteLink: string) {
  const { paper, ink, crust, paperDeep } = business.colors;
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:${paper};color:${ink};">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:${ink};">
<tr><td style="padding-bottom:20px;border-bottom:2px solid ${ink};">
<a href="${siteLink}" style="font-size:28px;font-weight:bold;color:${ink};text-decoration:none;letter-spacing:-0.5px;">${escapeHtml(business.name)}</a>
</td></tr>
<tr><td style="padding:24px 0;">${body}</td></tr>
<tr><td style="padding-top:18px;border-top:1px solid ${paperDeep};font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:${crust};">
${escapeHtml(fullAddress())} &middot; ${escapeHtml(business.contact.phone)}
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendReservationConfirmation(
  db: Db,
  reservation: {
    name: string;
    email: string;
    code: string;
    quantity: number;
    date: string;
    time: string;
    unitPriceCents: number;
    boxTitle: string;
  },
  links: { reservation: string; site: string }
) {
  const when = `${formatDate(reservation.date)} at ${formatTime(reservation.time)}`;
  const total = formatPrice(reservation.quantity * reservation.unitPriceCents);
  const boxes = `${reservation.quantity} ${reservation.quantity === 1 ? 'box' : 'boxes'}`;
  const greeting = firstName(reservation.name);
  const { crust, paperDeep } = business.colors;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 12px 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${crust};vertical-align:top;white-space:nowrap;">${label}</td><td style="padding:8px 0;font-weight:bold;">${escapeHtml(value)}</td></tr>`;

  const html = layout(
    `Your box is reserved for ${when}.`,
    `<p style="margin:0 0 16px;font-size:26px;line-height:1.2;">See you soon, ${escapeHtml(greeting)}.</p>
<p style="margin:0 0 20px;">${escapeHtml(reservation.boxTitle)} is on hold for you. Pay when you pick it up, with cash or card.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid ${paperDeep};border-bottom:1px solid ${paperDeep};margin-bottom:24px;">
${row('Pickup', when)}
${row('Quantity', boxes)}
${row('Due in store', total)}
${row('Reference', reservation.code)}
</table>
<p style="margin:0 0 24px;"><a href="${links.reservation}" style="display:inline-block;background:${crust};color:#ffffff;padding:12px 20px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;">View or cancel your reservation</a></p>
<p style="margin:0;font-size:15px;">This link is private to you, so please don’t share it. Need something else? Call us at ${escapeHtml(business.contact.phone)}.</p>`,
    links.site
  );

  const text = `See you soon, ${greeting}.

${reservation.boxTitle} is on hold for you. Pay when you pick it up, with cash or card.

Pickup: ${when}
Quantity: ${boxes}
Due in store: ${total}
Reference: ${reservation.code}

View or cancel your reservation (this link is private to you):
${links.reservation}

${business.name}
${fullAddress()}
${business.contact.phone}`;

  return deliver(db, {
    to: reservation.email,
    subject: `Your ${business.name} box: ${formatDate(reservation.date, 'medium')} at ${formatTime(reservation.time)}`,
    html,
    text
  });
}

export async function sendOwnerMessageNotice(
  db: Db,
  message: { name: string; email: string; phone: string; message: string },
  links: { messages: string; site: string }
) {
  const phoneLine = message.phone ? ` &middot; ${escapeHtml(message.phone)}` : '';
  const html = layout(
    `New message from ${message.name}.`,
    `<p style="margin:0 0 6px;font-size:24px;line-height:1.2;">New message from ${escapeHtml(message.name)}</p>
<p style="margin:0 0 20px;font-size:15px;">${escapeHtml(message.email)}${phoneLine}</p>
<p style="margin:0 0 24px;white-space:pre-wrap;">${escapeHtml(message.message)}</p>
<p style="margin:0;font-size:15px;">Reply to this email to answer them directly, or <a href="${links.messages}">open your messages</a>.</p>`,
    links.site
  );
  const text = `New message from ${message.name}
${message.email}${message.phone ? ` / ${message.phone}` : ''}

${message.message}

Reply to this email to answer them directly, or open your messages:
${links.messages}`;

  return deliver(db, {
    to: business.notifyEmail,
    subject: `New message from ${message.name}`,
    html,
    text,
    replyTo: message.email
  });
}
