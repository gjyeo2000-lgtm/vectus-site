(() => {
  const menu = document.querySelector('.mobile-menu');
  if (!menu) return;

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => { menu.open = false; });
  });
  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    menu.open = false;
    menu.querySelector('summary').focus();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) menu.open = false;
  });
})();
