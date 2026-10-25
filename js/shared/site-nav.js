(() => {
  const links = document.querySelectorAll('.header .nav a');
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const workPages = new Set(['index.html', 'ai-design-evolution.html', 'design-challenge.html', 'notes.html']);

  function updateNavigation() {
    const isContact = page === 'about.html' && window.location.hash === '#contact';
    links.forEach((link) => {
      const target = new URL(link.href, window.location.href);
      const targetPage = target.pathname.split('/').pop();
      const active = page === 'about.html'
        ? targetPage === 'about.html' && (isContact ? target.hash === '#contact' : !target.hash)
        : workPages.has(page) && targetPage === 'index.html';
      if (active) link.setAttribute('aria-current', isContact ? 'location' : 'page');
      else link.removeAttribute('aria-current');
    });
  }

  updateNavigation();
  window.addEventListener('hashchange', updateNavigation);
  window.addEventListener('pageshow', updateNavigation);
})();
