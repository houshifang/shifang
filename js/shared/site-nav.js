(() => {
  const links = document.querySelectorAll('.header .nav a');
  const pageName = (pathname) => {
    const name = pathname.split('/').pop() || 'index.html';
    return name.includes('.') ? name : `${name}.html`;
  };
  const page = pageName(window.location.pathname);
  const workPages = new Set(['index.html', 'ai-design-evolution.html', 'trust-conversion.html', 'design-challenge.html', 'notes.html']);

  function updateNavigation() {
    const isContact = page === 'about.html' && window.location.hash === '#contact';
    links.forEach((link) => {
      const target = new URL(link.href, window.location.href);
      const targetPage = pageName(target.pathname);
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
