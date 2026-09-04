(function () {
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const catList = document.getElementById('sideMenuCategories');

  if (!menuBtn || !sideMenu) return;

  menuBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    sideMenu.classList.toggle('open');
  });

  document.addEventListener('click', function (e) {
    if (!sideMenu.contains(e.target) && e.target !== menuBtn) {
      sideMenu.classList.remove('open');
    }
  });

  if (catList) {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        const items = data.items || [];
        items.forEach((c) => {
          const a = document.createElement('a');
          a.href = `/?category=${c.id}`;
          a.className = 'side-menu-link';
          a.textContent = c.name;
          catList.appendChild(a);
        });
      })
      .catch(() => {});
  }
})();
