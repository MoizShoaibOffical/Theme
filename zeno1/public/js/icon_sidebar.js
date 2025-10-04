(() => {
  function injectStyles() {
    if (document.getElementById('zeno-icon-sidebar-style')) return;
    const css = `
    .zeno-icon-sidebar .layout-side-section { width:30px !important; min-width:var(--zeno-sidebar-w,30px) !important; padding:4px 0 !important; border-right:1px solid var(--border-color, #e5e7eb); }
    .zeno-icon-sidebar .col-lg-2.layout-side-section { padding-left:0 !important; padding-right:0 !important; }
    .zeno-icon-sidebar .desk-sidebar .desk-sidebar-item .item-anchor { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2px 0; text-align:center; }
    .zeno-icon-sidebar .desk-sidebar .desk-sidebar-item .sidebar-item-icon { display:flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:6px; margin:0 0 2px 0; background:transparent; }
    .zeno-icon-sidebar .desk-sidebar .desk-sidebar-item.selected .sidebar-item-icon,
    .zeno-icon-sidebar .desk-sidebar .desk-sidebar-item:hover .sidebar-item-icon { background:#eaf3ff; }
    .zeno-icon-sidebar .desk-sidebar .desk-sidebar-item .sidebar-item-label { display:block !important; max-width:calc(var(--zeno-sidebar-w,30px) - 4px); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:8px; line-height:1.1; }
    .zeno-icon-sidebar .standard-sidebar-label, .zeno-icon-sidebar .drop-icon, .zeno-icon-sidebar .sidebar-child-item { display:none !important; }
    .zeno-icon-sidebar .desk-sidebar .standard-sidebar-item { background:transparent !important; border-radius:0 !important; padding:0 !important; }
    .zeno-icon-sidebar .standard-sidebar-label, .zeno-icon-sidebar .drop-icon, .zeno-icon-sidebar .sidebar-child-item { display:none !important; }
    .zeno-icon-sidebar .layout-side-section .desk-sidebar { max-height: calc(100vh - 90px); overflow-y:auto; margin:0; }
    `;
    const style = document.createElement('style');
    style.id = 'zeno-icon-sidebar-style';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function enableIconSidebar() {
    document.body.classList.add('zeno-icon-sidebar');
  }

  function createIconMenuContainer() {
    let container = document.querySelector('.side-menu-icons.menu-icons-with-label');
    if (container) return container;

    const leftSection = document.querySelector('.layout-side-section');
    if (!leftSection) return null;

    // Clear default list for a cleaner look but keep the section present
    const existing = leftSection.querySelector('.desk-sidebar');
    if (existing) existing.style.display = 'none';

    container = document.createElement('div');
    container.className = 'side-menu-icons menu-icons-with-label';

    const ul = document.createElement('ul');
    ul.className = 'list-unstyled';
    ul.tabIndex = 1;
    ul.style.overflow = 'hidden';
    ul.style.outline = 'none';
    container.appendChild(ul);
    leftSection.appendChild(container);

    // Add resizer handle
    const resizer = document.createElement('div');
    resizer.className = 'zeno-sidebar-resizer';
    leftSection.appendChild(resizer);
    let startX = 0; let startW = 0;
    function onMove(e){
      const dx = e.clientX - startX;
      const newW = Math.max(48, Math.min(240, startW + dx));
      document.documentElement.style.setProperty('--zeno-sidebar-w', newW + 'px');
    }
    function onUp(){
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    resizer.addEventListener('mousedown', (e)=>{
      startX = e.clientX;
      const styles = getComputedStyle(leftSection);
      startW = parseInt(styles.width, 10) || 48;
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
    return container;
  }

  async function buildIconMenu() {
    const container = createIconMenuContainer();
    if (!container) return;
    const ul = container.querySelector('ul');
    if (!ul) return;
    ul.innerHTML = '';

    try {
      const data = await (window.frappe?.xcall
        ? frappe.xcall('frappe.desk.desktop.get_workspace_sidebar_items')
        : frappe.call('frappe.desk.desktop.get_workspace_sidebar_items'));

      const pages = (data && data.pages) || [];
      const current = (frappe.get_route && frappe.get_route()) || [];
      const currentName = current[1] && current[1] !== 'private' ? current[1] : (current[2] || '');

      pages
        .filter(p => p.public) // modules list
        .forEach((page, idx) => {
          const li = document.createElement('li');
          if (page.title && currentName && frappe.router && frappe.router.slug(page.title) === frappe.router.slug(currentName)) {
            li.classList.add('active');
          }
          li.setAttribute('data-acccc', 'Home');
          li.setAttribute('data-mmmmm', page.title || page.name);

          const a = document.createElement('a');
          a.title = page.title || page.name;
          a.className = 'animated-tada';
          a.href = 'javascript:void(0)';
          a.onclick = () => {
            const route = page.public ? frappe.router.slug(page.title) : `private/${frappe.router.slug(page.title)}`;
            frappe.set_route(route);
          };

          const iconWrap = document.createElement('div');
          // Render frappe SVG icon so it always shows
          const iconName = page.icon || 'folder-normal';
          try {
            iconWrap.innerHTML = frappe.utils.icon(iconName, 'md');
          } catch (e) {
            iconWrap.innerHTML = frappe.utils.icon('folder-normal', 'md');
          }

          const span = document.createElement('span');
          span.textContent = page.title || page.name;
          a.appendChild(iconWrap);
          a.appendChild(span);
          li.appendChild(a);
          ul.appendChild(li);
        });
    } catch (e) {
      // fail silently
    }
  }

  // Apply on load and on route change
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    enableIconSidebar();
    buildIconMenu();
  });
  if (window.frappe && frappe.router) {
    frappe.router.on('change', () => {
      injectStyles();
      enableIconSidebar();
      buildIconMenu();
    });
  }
})();


