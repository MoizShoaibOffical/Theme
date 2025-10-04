(() => {
  const SIDEBAR_ID = "inner-workspace-sidebar";

  function qs(sel) { return document.querySelector(sel); }

  function ensureSidebarContainer() {
    // Place as a sibling immediately after the default workspace sidebar
    const leftSection = qs(".layout-side-section");

    let el = document.getElementById(SIDEBAR_ID);
    if (el) return el;

    const sidebar = document.createElement("div");
    sidebar.id = SIDEBAR_ID;
    sidebar.style.width = "240px";
    sidebar.style.minWidth = "240px";
    sidebar.style.position = "sticky";
    sidebar.style.top = "64px";
    sidebar.style.alignSelf = "start";
    sidebar.style.border = "1px solid #e5e7eb";
    sidebar.style.borderRadius = "8px";
    sidebar.style.padding = "8px";
    sidebar.style.background = "#fff";
    sidebar.style.boxShadow = "0 2px 4px rgba(0,0,0,0.06)";
    sidebar.style.height = "fit-content";
    sidebar.style.maxHeight = "calc(100vh - 80px)";
    sidebar.style.overflowY = "auto";

    if (leftSection && leftSection.parentElement) {
      const container = leftSection.parentElement;
      // Ensure horizontal layout so the new sidebar sits between left and main
      const currentDisplay = getComputedStyle(container).display;
      if (currentDisplay !== "flex" && currentDisplay !== "grid") {
        container.style.display = "flex";
      }
      container.style.alignItems = "flex-start";
      container.style.gap = container.style.gap || "6px";

      leftSection.insertAdjacentElement("afterend", sidebar);
      return sidebar;
    }

    // Fallback: attach beside main content when left section is not present
    const main = qs(".layout-main-section") || qs(".page-content") || qs(".workspace-container");
    if (!main) return null;
    main.style.display = "grid";
    main.style.gridTemplateColumns = "280px minmax(0, 1fr)";
    main.style.columnGap = "8px";
    main.style.alignItems = "start";
    main.insertBefore(sidebar, main.firstChild);
    return sidebar;
  }

  function sectionHTML(title, items) {
    const sec = document.createElement("div");
    sec.style.marginBottom = "12px";

    const head = document.createElement("button");
    const body = document.createElement("div");

    head.textContent = title || "Links";
    head.type = "button";
    head.style.cssText = "width:100%;text-align:left;font-weight:600;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;cursor:pointer;font-size:14px;color:#374151;";
    body.style.display = "none";
    body.style.padding = "8px 0 0 0";
    body.style.marginTop = "4px";
    head.onclick = () => { body.style.display = body.style.display === "none" ? "block" : "none"; };

    function routeItem(it) {
      const type = (it.type || "").toString().toLowerCase();
      if (type === "doctype" && it.doctype) {
        frappe.set_route("List", it.doctype);
        return;
      }
      if (type === "report" && (it.name || it.label)) {
        const name = it.name || it.label;
        if (it.report_type === "Query Report" || !it.ref_doctype) {
          frappe.set_route("query-report", name);
        } else {
          frappe.set_route("report", it.ref_doctype, name);
        }
        return;
      }
      if ((type === "page" || type === "link" || type === "url" || !type) && (it.route || it.name)) {
        const route = it.route || it.name;
        if (route) frappe.set_route(route);
        return;
      }
      if (it.route) {
        frappe.set_route(it.route);
        return;
      }
      if (it.link) {
        window.location.href = it.link;
      }
    }

    (items || []).forEach((it) => {
      const a = document.createElement("a");
      a.textContent = it.label || it.name || "";
      a.href = "javascript:void(0)";
      a.style.cssText = "display:block;padding:8px 12px;border-radius:4px;text-decoration:none;color:#4b5563;font-size:13px;transition:all .2s;border-left:3px solid transparent;";
      a.onmouseenter = () => { a.style.background = "#f3f4f6"; a.style.borderLeftColor = "#3b82f6"; a.style.color = "#1f2937"; };
      a.onmouseleave = () => { a.style.background = "transparent"; a.style.borderLeftColor = "transparent"; a.style.color = "#4b5563"; };
      a.onclick = (e) => { e.preventDefault(); routeItem(it); };
      body.appendChild(a);
    });

    sec.appendChild(head);
    sec.appendChild(body);
    return sec;
  }

  function normalizeLinks(links) {
    return (links || []).map((l) => {
      const typeRaw = l.link_type || l.type || l.link_to_type || "";
      const type = typeRaw.toString().toLowerCase();

      // Prefer target fields based on type to avoid picking child table doctype
      let doctype;
      let name;
      let route;
      let reportType = l.report_type;
      let refDoctype = l.ref_doctype || l.report_ref_doctype;

      if (type === "doctype") {
        doctype = l.link_to || l.doctype; // link_to is the actual target
      } else if (type === "report") {
        name = l.link_to || l.report_name || l.name;
      } else if (type === "page" || type === "dashboard" || type === "help" || type === "url" || type === "link") {
        route = l.route || l.link_url || l.url || l.link_to || l.name;
      }

      return {
        label: l.label || l.name || l.title || l.link_to || doctype || "Link",
        type: type || (l.link_to ? "link" : ""),
        doctype,
        report_type: reportType,
        ref_doctype: refDoctype,
        name,
        route,
        link: l.link_url || l.url,
      };
    });
  }

  function buildSidebarFromWorkspace(ws, workspaceTitle) {
    const sidebar = ensureSidebarContainer();
    if (!sidebar) return;

    sidebar.innerHTML = "";
    const title = document.createElement("div");
    title.textContent = workspaceTitle || "Workspace";
    title.style.cssText = "font-weight:700;margin-bottom:15px;font-size:16px;color:#1f2937;padding-bottom:10px;border-bottom:2px solid #e5e7eb;";
    sidebar.appendChild(title);

    const groups = [];

    const cardItems = Array.isArray(ws.cards) ? ws.cards : ws.cards && ws.cards.items ? ws.cards.items : [];
    const shortcutItems = Array.isArray(ws.shortcuts) ? ws.shortcuts : ws.shortcuts && ws.shortcuts.items ? ws.shortcuts.items : [];
    const quickListItems = Array.isArray(ws.quick_lists) ? ws.quick_lists : ws.quick_lists && ws.quick_lists.items ? ws.quick_lists.items : [];
    const chartItems = Array.isArray(ws.charts) ? ws.charts : ws.charts && ws.charts.items ? ws.charts.items : [];

    if (cardItems && cardItems.length) {
      cardItems.forEach((card) => {
        if (card.links && Array.isArray(card.links) && card.links.length) {
          groups.push({ title: card.label || card.title || card.name || "Links", items: normalizeLinks(card.links) });
        }
      });
    }

    if (shortcutItems && shortcutItems.length) groups.push({ title: "Shortcuts", items: normalizeLinks(shortcutItems) });

    if (quickListItems && quickListItems.length) {
      const items = quickListItems.map((q) => ({ label: q.label || q.document_type, type: "doctype", doctype: q.document_type, route: q.document_type ? `List/${q.document_type}` : undefined }));
      groups.push({ title: "Quick Lists", items });
    }

    if (chartItems && chartItems.length) {
      const items = chartItems.map((c) => ({ label: c.label || c.chart_name || c.name || "Chart", type: "chart", link: c.chart_name || "#" }));
      groups.push({ title: "Charts", items });
    }

    if (!groups.length) return; // keep it quiet if nothing to show
    groups.forEach((g) => sidebar.appendChild(sectionHTML(g.title, g.items)));
  }

  function guessWorkspaceNameFromModule(mod) {
    const map = { assets: "Assets", stock: "Stock", buying: "Buying", selling: "Selling", accounting: "Accounting", manufacturing: "Manufacturing", quality: "Quality", projects: "Projects", support: "Support", users: "Users", website: "Website", crm: "CRM", tools: "Tools", home: "Home", build: "Build", integrations: "Integrations" };
    if (!mod) return null; const m = mod.toLowerCase(); return map[m] || mod.charAt(0).toUpperCase() + mod.slice(1);
  }

  async function loadForRoute() {
    const r = frappe.get_route();
    if (!r || !r.length) return;

    if (r[0] === "workspace" && r[1]) {
      const name = r[1];
      const resp = await frappe.call({ method: "frappe.desk.desktop.get_desktop_page", args: { page: { name } } });
      if (resp?.message) buildSidebarFromWorkspace(resp.message, name);
      return;
    }

    if (r[0] === "Workspaces" && r[1]) {
      const name = r[1];
      const resp = await frappe.call({ method: "frappe.desk.desktop.get_desktop_page", args: { page: { name } } });
      if (resp?.message && Object.keys(resp.message).length > 0) buildSidebarFromWorkspace(resp.message, name);
      return;
    }

    if (r[0] === "app" && r[1]) {
      const name = guessWorkspaceNameFromModule(r[1]);
      const resp = await frappe.call({ method: "frappe.desk.desktop.get_desktop_page", args: { page: { name } } });
      if (resp?.message && Object.keys(resp.message).length > 0) buildSidebarFromWorkspace(resp.message, name);
      return;
    }
  }

  frappe.router.on("change", () => setTimeout(loadForRoute, 1200));
  document.addEventListener("DOMContentLoaded", () => setTimeout(loadForRoute, 2000));
})();


