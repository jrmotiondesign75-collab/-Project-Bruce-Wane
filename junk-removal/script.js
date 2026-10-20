document.getElementById('yr').textContent = new Date().getFullYear();

const btn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
btn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', e => { if (e.target.tagName === 'A') menu.classList.remove('open'); });

// Quote form: opens the visitor's email app with the details filled in.
// Replace QUOTE_EMAIL (or swap in Formspree/Netlify Forms) to receive requests directly.
const QUOTE_EMAIL = 'hello@example.com';
document.getElementById('quote').addEventListener('submit', e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const body = `Name: ${f.name}\nPhone: ${f.phone}\nEmail: ${f.email || '-'}\nJob: ${f.type}\n\n${f.details || ''}`;
  location.href = `mailto:${QUOTE_EMAIL}?subject=${encodeURIComponent('Junk removal quote request')}&body=${encodeURIComponent(body)}`;
  const msg = e.target.querySelector('.form-msg');
  msg.hidden = false;
  msg.textContent = 'Thanks! Your email app should open — hit send and we\'ll reply fast.';
});
