(function () {
  var section = document.getElementById('etf-emp');
  if (!section) return;
  var tabs = Array.from(section.querySelectorAll('[role="tab"]'));
  var panels = Array.from(section.querySelectorAll('[role="tabpanel"]'));

  function activate(index) {
    tabs.forEach(function (tab, position) {
      var selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(function (panel, position) { panel.hidden = position !== index; });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { activate(index); });
    tab.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next);
      tabs[next].focus();
    });
  });
})();
