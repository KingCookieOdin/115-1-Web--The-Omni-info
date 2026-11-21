const STORAGE_KEY = "omniInfoItems";
let items = [];
let currentView = "all";
let toastTimer;

const $ = (id) => document.getElementById(id);
const elements = {
  list: $("itemsList"), empty: $("emptyState"), search: $("searchInput"),
  type: $("typeFilter"), platform: $("platformFilter"), status: $("statusFilter"),
  sort: $("sortSelect"), dialog: $("itemDialog"), form: $("itemForm")
};

const typeDetails = {
  notification: { label: "Notification", icon: "♧" },
  message: { label: "Message", icon: "▤" },
  note: { label: "Note", icon: "✎" },
  bookmark: { label: "Bookmark", icon: "⌑" },
  statistic: { label: "Statistic", icon: "▥" }
};

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Could not load data.json");
    const data = await response.json();
    const saved = localStorage.getItem(STORAGE_KEY);
    items = saved ? JSON.parse(saved) : (data.items || []);
  } catch (error) {
    console.warn(error);
    const saved = localStorage.getItem(STORAGE_KEY);
    items = saved ? JSON.parse(saved) : [];
    showToast("Could not load data.json. Start Live Server and check the file.");
  }

  bindEvents();
  updateClock();
  setInterval(updateClock, 1000);
  render();
}

function bindEvents() {
  document.querySelectorAll(".nav-link[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      currentView = button.dataset.view;
      document.querySelectorAll(".nav-link[data-view]").forEach(link => link.classList.toggle("active", link === button));
      const titles = { all: "Overview", notifications: "Notifications", messages: "Messages & notes", bookmarks: "Bookmarks", statistics: "Statistics", unread: "Unread items", important: "Important items" };
      $("pageTitle").textContent = titles[currentView];
      $("breadcrumbTitle").textContent = titles[currentView];
      $("listTitle").textContent = currentView === "all" ? "All information" : titles[currentView];
      $("pageDescription").textContent = currentView === "all" ? "Collect, organize, and find everything that matters." : `Browse and manage your ${titles[currentView].toLowerCase()}.`;
      $("sidebar").classList.remove("open");
      render();
    });
  });

  ["search", "type", "platform", "status", "sort"].forEach(key => {
    const eventName = key === "search" ? "input" : "change";
    elements[key].addEventListener(eventName, render);
  });

  $("openFormButton").addEventListener("click", () => openForm());
  $("emptyAddButton").addEventListener("click", () => openForm());
  $("closeDialogButton").addEventListener("click", closeForm);
  $("cancelButton").addEventListener("click", closeForm);
  elements.form.addEventListener("submit", handleSubmit);
  $("resetFiltersButton").addEventListener("click", resetFilters);
  $("exportButton").addEventListener("click", exportJSON);
  $("importInput").addEventListener("change", importJSON);
  $("mobileMenu").addEventListener("click", () => $("sidebar").classList.toggle("open"));
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function render() {
  updateStats();
  populatePlatformFilter();
  const filtered = getFilteredItems();
  $("resultCount").textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"} shown`;
  elements.list.innerHTML = "";
  elements.empty.hidden = filtered.length !== 0;

  filtered.forEach(item => {
    const type = typeDetails[item.type] || typeDetails.note;
    const row = document.createElement("article");
    row.className = "item-row";

    const main = document.createElement("div");
    main.className = "item-main";
    const icon = document.createElement("div");
    icon.className = "type-icon";
    icon.textContent = type.icon;
    const copy = document.createElement("div");
    copy.className = "item-copy";
    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = item.title;
    if (item.important) {
      const star = document.createElement("span");
      star.className = "star";
      star.textContent = "★";
      title.append(star);
    }
    const content = document.createElement("div");
    content.className = "item-content";
    content.textContent = item.content;
    copy.append(title, content);
    main.append(icon, copy);

    const source = document.createElement("div");
    source.className = "item-source";
    const sourcePill = document.createElement("span");
    sourcePill.className = "source-pill";
    sourcePill.textContent = item.platform;
    source.append(sourcePill);

    const date = document.createElement("div");
    date.className = "item-date";
    date.textContent = formatDate(item.date);

    const status = document.createElement("div");
    status.className = "item-status";
    const statusPill = document.createElement("span");
    statusPill.className = `status-pill ${item.read ? "read" : "unread"}`;
    statusPill.textContent = item.read ? "Read" : "Unread";
    status.append(statusPill);

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.append(
      makeActionButton(item.read ? "○" : "●", item.read ? "Mark unread" : "Mark read", () => toggleRead(item.id)),
      makeActionButton("✎", "Edit item", () => openForm(item)),
      makeActionButton("×", "Delete item", () => deleteItem(item.id))
    );
    row.append(main, source, date, status, actions);
    elements.list.append(row);
  });
}

function getFilteredItems() {
  const query = elements.search.value.trim().toLowerCase();
  let result = items.filter(item => {
    const matchesView =
      currentView === "all" ||
      (currentView === "notifications" && item.type === "notification") ||
      (currentView === "messages" && ["message", "note"].includes(item.type)) ||
      (currentView === "bookmarks" && item.type === "bookmark") ||
      (currentView === "statistics" && item.type === "statistic") ||
      (currentView === "unread" && !item.read) ||
      (currentView === "important" && item.important);

    const matchesQuery = !query || [item.title, item.content, item.platform, ...(item.tags || [])].join(" ").toLowerCase().includes(query);
    const matchesType = elements.type.value === "all" || item.type === elements.type.value;
    const matchesPlatform = elements.platform.value === "all" || item.platform === elements.platform.value;
    const matchesStatus = elements.status.value === "all" ||
      (elements.status.value === "unread" && !item.read) ||
      (elements.status.value === "read" && item.read) ||
      (elements.status.value === "important" && item.important);
    return matchesView && matchesQuery && matchesType && matchesPlatform && matchesStatus;
  });

  const sort = elements.sort.value;
  result.sort((a, b) => {
    if (sort === "oldest") return new Date(a.date) - new Date(b.date);
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "platform") return a.platform.localeCompare(b.platform);
    return new Date(b.date) - new Date(a.date);
  });
  return result;
}

function updateStats() {
  $("totalCount").textContent = items.length;
  $("unreadCount").textContent = items.filter(item => !item.read).length;
  $("importantCount").textContent = items.filter(item => item.important).length;
  $("platformCount").textContent = new Set(items.map(item => item.platform.toLowerCase())).size;
}

function populatePlatformFilter() {
  const previous = elements.platform.value;
  const platforms = [...new Set(items.map(item => item.platform))].sort((a, b) => a.localeCompare(b));
  elements.platform.innerHTML = '<option value="all">All platforms</option>';
  platforms.forEach(platform => {
    const option = document.createElement("option");
    option.value = platform;
    option.textContent = platform;
    elements.platform.append(option);
  });
  elements.platform.value = platforms.includes(previous) ? previous : "all";
}

function makeActionButton(symbol, label, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  button.textContent = symbol;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", action);
  return button;
}

function openForm(item = null) {
  elements.form.reset();
  $("itemId").value = item ? item.id : "";
  $("dialogTitle").textContent = item ? "Edit information" : "Add information";
  $("titleInput").value = item?.title || "";
  $("platformInput").value = item?.platform || "";
  $("itemTypeInput").value = item?.type || "notification";
  $("dateInput").value = toDateTimeLocal(item?.date || new Date().toISOString());
  $("contentInput").value = item?.content || "";
  $("tagsInput").value = (item?.tags || []).join(", ");
  $("importantInput").checked = Boolean(item?.important);
  $("readInput").checked = Boolean(item?.read);
  elements.dialog.showModal();
  $("titleInput").focus();
}

function closeForm() {
  elements.dialog.close();
}

function handleSubmit(event) {
  event.preventDefault();
  const id = $("itemId").value;
  const existing = items.find(item => String(item.id) === id);
  const newItem = {
    id: existing ? existing.id : Date.now(),
    title: $("titleInput").value.trim(),
    platform: $("platformInput").value.trim(),
    type: $("itemTypeInput").value,
    date: new Date($("dateInput").value).toISOString(),
    content: $("contentInput").value.trim(),
    tags: $("tagsInput").value.split(",").map(tag => tag.trim()).filter(Boolean),
    important: $("importantInput").checked,
    read: $("readInput").checked
  };

  if (!newItem.title || !newItem.platform || !newItem.content) return;
  if (existing) {
    items = items.map(item => item.id === existing.id ? newItem : item);
    showToast("Information updated.");
  } else {
    items.unshift(newItem);
    showToast("Information added.");
  }
  persist();
  closeForm();
  render();
}

function toggleRead(id) {
  items = items.map(item => item.id === id ? { ...item, read: !item.read } : item);
  persist();
  render();
}

function deleteItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item || !confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
  items = items.filter(entry => entry.id !== id);
  persist();
  render();
  showToast("Item deleted.");
}

function resetFilters() {
  elements.search.value = "";
  elements.type.value = "all";
  elements.platform.value = "all";
  elements.status.value = "all";
  elements.sort.value = "newest";
  render();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function toDateTimeLocal(value) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function updateClock() {
  $("clock").textContent = new Date().toLocaleTimeString(undefined, { hour12: false });
}

function exportJSON() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), items }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "omni-info-export.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Your JSON export is ready.");
}

async function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const importedItems = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(importedItems) || !importedItems.every(isValidItem)) {
      throw new Error("The file does not contain a valid items array.");
    }
    if (!confirm(`Import ${importedItems.length} items? This will replace your current workspace data.`)) return;
    items = importedItems;
    persist();
    render();
    showToast("JSON data imported.");
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function isValidItem(item) {
  return item && ["notification", "message", "note", "bookmark", "statistic"].includes(item.type) &&
    typeof item.title === "string" && typeof item.platform === "string" &&
    typeof item.content === "string" && item.date;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
