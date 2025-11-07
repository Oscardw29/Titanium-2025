// Highlight the current page link in the header navigation
// Adds .active and aria-current="page" to the matching <a>
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;
  const links = nav.querySelectorAll('a[href]');

  // Normalize current path (filename only)
  let current = window.location.pathname.split('/').pop();
  if (!current || current === '/') current = 'index.html';

  let matched = false;
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (href === current) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
      matched = true;
    } else {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    }
  });

  // Fallback: if nothing matched, try to match by last segment ignoring query/hash
  if (!matched) {
    const cleanPath = current.split('?')[0].split('#')[0];
    links.forEach(a => {
      const href = a.getAttribute('href').split('?')[0].split('#')[0];
      if (href === cleanPath) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }
});
