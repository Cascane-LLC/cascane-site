const FORM_ATTRS = { name: 'delete-account', method: 'POST', 'data-netlify': 'true', 'netlify-honeypot': 'bot-field', action: '/delete-account-received' };
const HIDDEN = { 'form-name': 'delete-account', subject: 'Account Deletion Request' };

export default function deleteForm(ctx) {
  if (!ctx.exists('delete-account.html')) return ['delete-account.html missing'];
  const errors = [];
  const forms = ctx.doc('delete-account.html').querySelectorAll('form');
  if (forms.length !== 1) return [`delete-account.html: expected 1 form, found ${forms.length}`];
  const form = forms[0];
  for (const [k, v] of Object.entries(FORM_ATTRS)) {
    if (form.getAttribute(k) !== v) errors.push(`form[${k}] is ${JSON.stringify(form.getAttribute(k))}, expected ${JSON.stringify(v)}`);
  }
  for (const [name, value] of Object.entries(HIDDEN)) {
    const el = form.querySelector(`input[type="hidden"][name="${name}"]`);
    if (el?.getAttribute('value') !== value) errors.push(`hidden input ${name} missing or wrong`);
  }
  if (!form.querySelector('input[name="bot-field"]')) errors.push('honeypot input bot-field missing');
  const email = form.querySelector('input[name="email"]');
  if (email?.getAttribute('type') !== 'email' || !email.hasAttribute('required')) errors.push('email input must be type=email and required');
  if (!form.querySelector('input[name="username"]')) errors.push('username input missing');
  if (!form.querySelector('textarea[name="message"]')) errors.push('message textarea missing');
  if (!form.querySelector('button[type="submit"]')) errors.push('submit button missing');
  return errors;
}
