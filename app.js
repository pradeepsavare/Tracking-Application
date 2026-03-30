const STORAGE_KEYS = {
  SESSION: "trackingApp.session",
  BAGS: "trackingApp.bags",
  USERS: "trackingApp.users",
  AUTH_MODE: "trackingApp.authMode"
};

const STATUS_FLOW = ["Processing", "In Transit", "Delivered"];

const appEl = document.getElementById("app");

const defaultBags = [
  {
    id: "BG-2001",
    bagName: "Skyline Cabin Roller",
    owner: "demo@tracking.local",
    imageData: "",
    brand: "AeroPack",
    color: "Graphite",
    destination: "Mumbai",
    status: "In Transit",
    currentLocation: "Pune Hub",
    lastUpdated: "2026-03-25 18:40",
    events: [
      { time: "2026-03-24 09:30", note: "Bag received at origin center" },
      { time: "2026-03-25 08:20", note: "Scanned at sorting facility" },
      { time: "2026-03-25 18:40", note: "Out for intercity transfer" }
    ]
  },
  {
    id: "BG-2002",
    bagName: "Urban Duffel",
    owner: "demo@tracking.local",
    imageData: "",
    brand: "TrailNomad",
    color: "Ocean Blue",
    destination: "Delhi",
    status: "Delivered",
    currentLocation: "Delivered",
    lastUpdated: "2026-03-24 14:10",
    events: [
      { time: "2026-03-22 11:00", note: "Shipment created" },
      { time: "2026-03-23 16:45", note: "Arrived at destination city" },
      { time: "2026-03-24 14:10", note: "Delivered to customer" }
    ]
  }
];

const defaultUsers = [
  {
    email: "demo@tracking.local",
    password: "demo1234",
    fullName: "Demo User",
    mobile: "9999999999",
    gender: "Prefer not to say"
  }
];

let state = {
  session: loadSession(),
  users: loadUsers(),
  bags: loadBags(),
  trackingResult: null,
  authMessage: { type: "", text: "" },
  authMode: loadAuthMode(),
  confirmationDialog: null,
  isAddingBag: false,
  addBagMessage: { type: "", text: "" },
  lastAddedBagId: "",
  statusUpdateBagId: "",
  statusUpdateTarget: "",
  isAuthLoading: false,
  isTrackLoading: false,
  isLogoutLoading: false
};

bootstrap();
render();

function bootstrap() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    state.users = defaultUsers;
  }

  if (!localStorage.getItem(STORAGE_KEYS.BAGS)) {
    localStorage.setItem(STORAGE_KEYS.BAGS, JSON.stringify(defaultBags));
    state.bags = defaultBags;
  }

  // Migrate any old demo owner value to email-based ownership.
  state.bags = state.bags.map((bag) =>
    bag.owner === "Demo User" ? { ...bag, owner: "demo@tracking.local" } : bag
  );
  saveBags();

  // Migrate existing users to include profile fields.
  state.users = state.users.map((user) => ({
    ...user,
    fullName: user.fullName || user.name || "User",
    mobile: user.mobile || "",
    gender: user.gender || "Prefer not to say"
  }));
  saveUsers();

  if (state.session && !findUserByEmail(state.session.email)) {
    state.session = null;
    saveSession(null);
  }
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || "null");
  } catch {
    return null;
  }
}

function loadAuthMode() {
  const saved = localStorage.getItem(STORAGE_KEYS.AUTH_MODE);
  return saved === "register" ? "register" : "login";
}

function saveAuthMode(mode) {
  localStorage.setItem(STORAGE_KEYS.AUTH_MODE, mode === "register" ? "register" : "login");
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
  } catch {
    return [];
  }
}

function loadBags() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BAGS) || "[]");
  } catch {
    return [];
  }
}

function saveSession(session) {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

function saveUsers() {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(state.users));
}

function saveBags() {
  localStorage.setItem(STORAGE_KEYS.BAGS, JSON.stringify(state.bags));
}

function bagsForCurrentUser() {
  const userEmail = normalizeEmail(state.session?.email || "");
  return state.bags.filter((bag) => normalizeEmail(bag.owner || "") === userEmail);
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return state.users.find((user) => normalizeEmail(user.email) === normalized);
}

function currentUser() {
  if (!state.session?.email) {
    return null;
  }

  return findUserByEmail(state.session.email) || null;
}

function render() {
  document.body.classList.toggle("auth-layout", !state.session);

  if (!state.session) {
    appEl.innerHTML = authTemplate();
    bindAuthEvents();
    return;
  }

  appEl.innerHTML = dashboardTemplate();
  bindDashboardEvents();
}

function renderAuthModeTransition() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || prefersReducedMotion) {
    render();
    return;
  }

  document.startViewTransition(() => {
    render();
  });
}

function authTemplate() {
  const isLogin = state.authMode === "login";

  return `
     <section class="auth-screen ${isLogin ? "auth-screen-login" : "auth-screen-register"}">
      <div class="glass-card rounded-2xl w-full max-w-5xl grid md:grid-cols-2 overflow-hidden shadow-2xl auth-card-wrap auth-shell ${isLogin ? "auth-shell-login" : "auth-shell-register"}">
        <div class="auth-shell-outline" aria-hidden="true"></div>
        <div class="auth-shell-aura" aria-hidden="true"></div>
        <div class="p-6 md:p-8 lg:p-9 text-white auth-hero-panel ${isLogin ? "auth-hero-panel-login auth-hero-surface-login" : "auth-hero-panel-register auth-hero-surface-register"}">
          <p class="uppercase tracking-[0.25em] text-xs mb-4">Smart Logistics</p>
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-extrabold brand-font leading-tight">Track Every Bag, Every Step</h1>
          <p class="mt-4 lg:mt-5 text-teal-100 max-w-md">Login to manage shipments, add new bags, and track bag location in real time with tracking IDs.</p>
          <ul class="mt-6 lg:mt-7 space-y-2 text-sm">
            <li>Live shipment timeline</li>
            <li>Add unlimited bags</li>
            <li>Simple login and logout</li>
          </ul>
        </div>
        <div class="p-6 md:p-8 lg:p-9 bg-white auth-form-scroll auth-panel ${isLogin ? "auth-panel-login" : "auth-panel-register"}">
          <div class="auth-toggle mb-5" aria-label="Authentication mode switch">
            <div class="auth-toggle-indicator ${isLogin ? "auth-toggle-indicator-login" : "auth-toggle-indicator-register"}" aria-hidden="true"></div>
            <button id="auth-login-mode" class="auth-toggle-btn ${isLogin ? "is-active" : ""}">Login</button>
            <button id="auth-register-mode" class="auth-toggle-btn ${!isLogin ? "is-active" : ""}">Register</button>
          </div>
          <div class="auth-form-stage ${isLogin ? "auth-form-stage-login" : "auth-form-stage-register"}">
            <h2 class="text-2xl font-bold brand-font mb-1">${isLogin ? "Welcome back" : "Create account"}</h2>
            <p class="text-slate-500 text-sm mb-4">${isLogin ? "Enter your account details" : "Register once, then track bags anytime"}</p>

            <form id="auth-form" class="space-y-4">
            ${
              !isLogin
                ? `
            <div>
              <label class="field-label">Full Name</label>
              <input class="input-base" name="fullName" type="text" placeholder="Your full name" required />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="field-label">Mobile Number</label>
                <input class="input-base" name="mobile" type="tel" placeholder="10-digit number" required />
              </div>
              <div>
                <label class="field-label">Gender</label>
                <select class="input-base" name="gender" required>
                  <option value="" selected disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            `
                : ""
            }
            <div>
              <label class="field-label">Email</label>
              <input class="input-base" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div>
              <label class="field-label">Password</label>
              <input class="input-base" name="password" type="password" minlength="4" placeholder="Minimum 4 characters" required />
            </div>
            <button class="btn-primary auth-submit-btn ${isLogin ? "auth-submit-btn-login" : "auth-submit-btn-register"} w-full py-3 rounded-xl flex items-center justify-center gap-2 ${state.isAuthLoading ? "opacity-85 cursor-not-allowed" : ""}" ${state.isAuthLoading ? "disabled" : ""}>
              ${
                state.isAuthLoading
                  ? `${antIconTemplate("loading", "ant-icon ant-icon-sm ant-icon-spin")}<span>${isLogin ? "Logging in..." : "Registering..."}</span>`
                  : isLogin
                  ? "Login"
                  : "Register"
              }
            </button>
            </form>
            <p id="auth-message" class="text-sm mt-4 ${
            state.authMessage.type === "success"
              ? "text-green-700"
              : state.authMessage.type === "error"
              ? "text-red-600"
              : "text-slate-600"
            }">${escapeHtml(state.authMessage.text || "")}</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function dashboardTemplate() {
  const user = currentUser();
  const userEmail = state.session?.email || "User";
  const userName = user?.fullName || userEmail;
  const myBags = bagsForCurrentUser();
  const total = myBags.length;
  const processing = myBags.filter((b) => b.status === "Processing").length;
  const inTransit = myBags.filter((b) => b.status === "In Transit").length;
  const delivered = myBags.filter((b) => b.status === "Delivered").length;

  const trackingPanel = state.trackingResult
    ? trackingResultTemplate(state.trackingResult)
    : `<p class="text-sm text-slate-500 mt-3">Search by tracking ID to view bag journey.</p>`;

  return `
    <section class="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <header class="glass-card rounded-2xl p-5 md:p-6 flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-teal-700 font-semibold">Bag Tracking Application</p>
          <h1 class="text-2xl md:text-3xl font-extrabold brand-font">Hello, ${escapeHtml(userName)}</h1>
        </div>
        <button id="logout-btn" class="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold inline-flex items-center justify-center gap-2 ${state.isLogoutLoading ? "opacity-85 cursor-not-allowed" : ""}" ${state.isLogoutLoading ? "disabled" : ""}>
          ${
            state.isLogoutLoading
              ? `${antIconTemplate("loading", "ant-icon ant-icon-sm ant-icon-spin")}<span>Logging out...</span>`
              : "Logout"
          }
        </button>
      </header>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <article class="glass-card rounded-2xl p-4">
          <p class="text-sm text-slate-500">Total Bags</p>
          <h3 class="text-3xl font-bold brand-font">${total}</h3>
        </article>
        <article class="glass-card rounded-2xl p-4">
          <p class="text-sm text-slate-500">Processing</p>
          <h3 class="text-3xl font-bold brand-font">${processing}</h3>
        </article>
        <article class="glass-card rounded-2xl p-4">
          <p class="text-sm text-slate-500">In Transit</p>
          <h3 class="text-3xl font-bold brand-font">${inTransit}</h3>
        </article>
        <article class="glass-card rounded-2xl p-4">
          <p class="text-sm text-slate-500">Delivered</p>
          <h3 class="text-3xl font-bold brand-font">${delivered}</h3>
        </article>
      </div>

      <section class="glass-card rounded-2xl p-5 mt-5">
        <h2 class="text-xl font-bold brand-font">Profile</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-sm">
          <div class="bg-white/80 rounded-xl p-3 border border-slate-200">
            <p class="text-slate-500">Name</p>
            <p class="font-semibold">${escapeHtml(user?.fullName || "-")}</p>
          </div>
          <div class="bg-white/80 rounded-xl p-3 border border-slate-200">
            <p class="text-slate-500">Email</p>
            <p class="font-semibold break-all">${escapeHtml(userEmail)}</p>
          </div>
          <div class="bg-white/80 rounded-xl p-3 border border-slate-200">
            <p class="text-slate-500">Mobile</p>
            <p class="font-semibold">${escapeHtml(user?.mobile || "-")}</p>
          </div>
          <div class="bg-white/80 rounded-xl p-3 border border-slate-200">
            <p class="text-slate-500">Gender</p>
            <p class="font-semibold">${escapeHtml(user?.gender || "-")}</p>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button id="delete-account-btn" class="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-semibold text-sm">Delete Account</button>
        </div>
      </section>

      <div class="grid lg:grid-cols-5 gap-5 mt-6">
        <section class="glass-card rounded-2xl p-5 lg:col-span-2">
          <h2 class="text-xl font-bold brand-font">Add New Bag</h2>
          <form id="add-bag-form" class="space-y-3 mt-4">
            <div>
              <label class="field-label">Bag Name</label>
              <input class="input-base" name="bagName" required placeholder="Ex: Cabin Trolley" />
            </div>
            <div>
              <label class="field-label">Brand</label>
              <input class="input-base" name="brand" required placeholder="Ex: Samsonite" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="field-label">Color</label>
                <input class="input-base" name="color" required placeholder="Black" />
              </div>
              <div>
                <label class="field-label">Destination</label>
                <input class="input-base" name="destination" required placeholder="Bengaluru" />
              </div>
            </div>
            <div>
              <label class="field-label">Tracking ID</label>
              <input class="input-base" name="trackingId" required placeholder="Ex: BG-2109" />
            </div>
            <div>
              <label class="field-label">Bag Image</label>
              <input class="input-base" name="bagImage" type="file" accept="image/*" required />
            </div>
            <div id="bag-image-preview-wrap" class="bag-image-preview-wrap hidden">
              <p class="text-xs font-semibold text-slate-500 mb-2">Image Preview</p>
              <img id="bag-image-preview" class="bag-image-preview" alt="Selected bag preview" />
            </div>
            <button class="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 ${state.isAddingBag ? "opacity-85 cursor-not-allowed" : ""}" ${state.isAddingBag ? "disabled" : ""}>
              ${
                state.isAddingBag
                  ? `${antIconTemplate("loading", "ant-icon ant-icon-sm ant-icon-spin")}<span>Adding bag...</span>`
                  : "Add Bag"
              }
            </button>
          </form>
          <p id="add-message" class="text-sm mt-3 ${
            state.addBagMessage.type === "success"
              ? "text-green-700"
              : state.addBagMessage.type === "error"
              ? "text-red-600"
              : "text-slate-600"
          }">${escapeHtml(state.addBagMessage.text || "")}</p>
        </section>

        <section class="glass-card rounded-2xl p-5 lg:col-span-3">
          <h2 class="text-xl font-bold brand-font">Track Bag</h2>
          <form id="track-form" class="flex flex-col sm:flex-row gap-3 mt-4">
            <input class="input-base" name="trackingId" placeholder="Enter tracking ID" required />
            <button class="btn-primary px-5 rounded-xl whitespace-nowrap inline-flex items-center justify-center gap-2 ${state.isTrackLoading ? "opacity-85 cursor-not-allowed" : ""}" ${state.isTrackLoading ? "disabled" : ""}>
              ${
                state.isTrackLoading
                  ? `${antIconTemplate("loading", "ant-icon ant-icon-sm ant-icon-spin")}<span>Tracking...</span>`
                  : "Track"
              }
            </button>
          </form>
          ${trackingPanel}
        </section>
      </div>

      <section class="glass-card rounded-2xl p-5 mt-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 class="text-xl font-bold brand-font">Your Bags</h2>
          <div class="flex flex-wrap items-center gap-3">
            <button id="clear-track-btn" class="text-sm font-semibold text-slate-600 hover:text-slate-900">Clear Search</button>
            <button id="clear-bags-btn" class="text-sm font-semibold text-red-700 hover:text-red-900">Clear My Bags</button>
          </div>
        </div>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          ${myBags.length ? myBags.map(bagCardTemplate).join("") : `<p class="text-sm text-slate-500">No bags added yet.</p>`}
        </div>
      </section>

      ${confirmationDialogTemplate()}
    </section>
  `;
}

function confirmationDialogTemplate() {
  if (!state.confirmationDialog) {
    return "";
  }

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-slate-900/45" id="confirm-overlay"></div>
      <div class="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6">
        <h3 class="text-xl font-bold brand-font">${escapeHtml(state.confirmationDialog.title)}</h3>
        <p class="text-sm text-slate-600 mt-2">${escapeHtml(state.confirmationDialog.message)}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button id="confirm-no-btn" class="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold">No</button>
          <button id="confirm-yes-btn" class="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold">Yes</button>
        </div>
      </div>
    </div>
  `;
}

function bagCardTemplate(bag) {
  const badgeClass = statusBadgeClass(bag.status);
  const bagImage = getBagImage(bag.imageData);
  const isNewlyAdded = state.lastAddedBagId === bag.id;
  const isUpdating = state.statusUpdateBagId === bag.id;

  const canMoveToTransit = canTransitionToNext(bag.status, "In Transit");
  const canMoveToDelivered = canTransitionToNext(bag.status, "Delivered");

  const transitBtnDisabled = isUpdating || !canMoveToTransit;
  const deliveredBtnDisabled = isUpdating || !canMoveToDelivered;

  return `
    <article class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${isNewlyAdded ? "bag-card-new" : ""}">
      <img src="${bagImage}" alt="${escapeHtml(bag.bagName)}" class="w-full h-40 object-cover rounded-lg mb-3 border border-slate-200" />
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-bold brand-font text-lg">${escapeHtml(bag.bagName)}</h3>
        <span class="badge ${badgeClass}">${escapeHtml(bag.status)}</span>
      </div>
      <p class="text-sm text-slate-500 mt-1">ID: <span class="font-semibold">${escapeHtml(bag.id)}</span></p>
      <p class="text-sm mt-2">${escapeHtml(bag.brand)} | ${escapeHtml(bag.color)}</p>
      <p class="text-sm text-slate-600">Destination: ${escapeHtml(bag.destination)}</p>
      <p class="text-sm text-slate-600">Current: ${escapeHtml(bag.currentLocation)}</p>
      <p class="text-xs text-slate-500 mt-2">Updated: ${escapeHtml(bag.lastUpdated)}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="status-btn px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed inline-flex items-center gap-1.5" disabled data-id="${escapeHtml(bag.id)}" data-status="Processing">${antIconTemplate("processing", "ant-icon status-icon")}<span>Processing</span></button>
        <button class="status-btn px-3 py-1.5 text-xs rounded-lg border ${
          transitBtnDisabled ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed" : "border-slate-300 hover:bg-slate-100"
        } inline-flex items-center gap-1.5" ${transitBtnDisabled ? "disabled" : ""} data-id="${escapeHtml(bag.id)}" data-status="In Transit">
          ${
            isUpdating && state.statusUpdateTarget === "In Transit"
              ? antIconTemplate("loading", "ant-icon status-icon ant-icon-spin")
              : antIconTemplate("transit", "ant-icon status-icon")
          }
          <span>${isUpdating && state.statusUpdateTarget === "In Transit" ? "Updating..." : "Transit"}</span>
        </button>
        <button class="status-btn px-3 py-1.5 text-xs rounded-lg border ${
          deliveredBtnDisabled ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed" : "border-slate-300 hover:bg-slate-100"
        } inline-flex items-center gap-1.5" ${deliveredBtnDisabled ? "disabled" : ""} data-id="${escapeHtml(bag.id)}" data-status="Delivered">
          ${
            isUpdating && state.statusUpdateTarget === "Delivered"
              ? antIconTemplate("loading", "ant-icon status-icon ant-icon-spin")
              : antIconTemplate("delivered", "ant-icon status-icon")
          }
          <span>${isUpdating && state.statusUpdateTarget === "Delivered" ? "Updating..." : "Delivered"}</span>
        </button>
        <button class="delete-bag-btn px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-700 hover:bg-red-50" data-id="${escapeHtml(bag.id)}">Delete</button>
      </div>
    </article>
  `;
}

function trackingResultTemplate(bag) {
  const bagImage = getBagImage(bag.imageData);
  const showProgress = bag.id !== "Not Found";

  return `
    <div class="mt-4 p-4 rounded-xl bg-white border border-slate-200">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="font-bold text-lg brand-font">${escapeHtml(bag.bagName)}</h3>
          <p class="text-sm text-slate-500">Tracking ID: ${escapeHtml(bag.id)}</p>
        </div>
        <span class="badge ${statusBadgeClass(bag.status)}">${escapeHtml(bag.status)}</span>
      </div>
      <img src="${bagImage}" alt="${escapeHtml(bag.bagName)}" class="w-full h-44 sm:h-56 object-cover rounded-lg border border-slate-200 mt-3" />
      ${showProgress ? trackingProgressTemplate(bag) : ""}
      <p class="text-sm mt-2">Current location: <strong>${escapeHtml(bag.currentLocation)}</strong></p>
      <p class="text-sm">Destination: <strong>${escapeHtml(bag.destination)}</strong></p>
      <h4 class="font-semibold mt-3 mb-2">Timeline</h4>
      <ul class="text-sm space-y-1">
        ${bag.events
          .slice()
          .reverse()
          .map((e) => `<li>• ${escapeHtml(e.time)} - ${escapeHtml(e.note)}</li>`)
          .join("")}
      </ul>
    </div>
  `;
}

function trackingProgressTemplate(bag) {
  const currentIndex = statusIndex(bag.status);
  const stepIconByStatus = {
    Processing: "processing",
    "In Transit": "transit",
    Delivered: "delivered"
  };

  return `
    <section class="tracking-progress mt-4" aria-label="Tracking progress">
      <div class="progress-steps">
        ${STATUS_FLOW.map((step, index) => {
          const stateClass =
            index < currentIndex ? "is-complete" : index === currentIndex ? "is-current" : "is-pending";

          return `
            <div class="progress-step ${stateClass}">
              <span class="step-dot"></span>
              <p class="step-label">${antIconTemplate(stepIconByStatus[step], "ant-icon step-ant-icon")}${escapeHtml(step)}</p>
            </div>
          `;
        }).join("")}
      </div>
      ${
        bag.status !== "Delivered"
          ? `<div class="tracking-live mt-3">${antIconTemplate("loading", "ant-icon ant-icon-sm ant-icon-spin")}<span>Live update in progress...</span></div>`
          : `<div class="tracking-live mt-3 delivered-live">${antIconTemplate("delivered", "ant-icon ant-icon-sm")}<span>Shipment completed</span></div>`
      }
      <div class="progress-shimmer mt-2" aria-hidden="true"></div>
    </section>
  `;
}

function bindAuthEvents() {
  const loginBtn = document.getElementById("auth-login-mode");
  const registerBtn = document.getElementById("auth-register-mode");

  loginBtn?.addEventListener("click", () => {
    if (state.authMode === "login") {
      return;
    }

    state.authMode = "login";
    state.authMessage = { type: "", text: "" };
    state.isAuthLoading = false;
    saveAuthMode(state.authMode);
    renderAuthModeTransition();
  });

  registerBtn?.addEventListener("click", () => {
    if (state.authMode === "register") {
      return;
    }

    state.authMode = "register";
    state.authMessage = { type: "", text: "" };
    state.isAuthLoading = false;
    saveAuthMode(state.authMode);
    renderAuthModeTransition();
  });

  document.getElementById("auth-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.isAuthLoading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") || "").trim();
    const mobile = String(formData.get("mobile") || "").trim();
    const gender = String(formData.get("gender") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    state.isAuthLoading = true;
    state.authMessage = {
      type: "info",
      text: state.authMode === "login" ? "Checking credentials..." : "Creating your account..."
    };
    render();
    await delay(700);

    if (!email || password.length < 4) {
      state.authMessage = { type: "error", text: "Please enter valid credentials." };
      state.isAuthLoading = false;
      render();
      return;
    }

    const normalizedEmail = normalizeEmail(email);

    if (state.authMode === "register") {
      if (!fullName || !mobile || !gender || !email || !password) {
        state.authMessage = { type: "error", text: "Please fill all registration fields." };
        state.isAuthLoading = false;
        render();
        return;
      }

      if (!fullName) {
        state.authMessage = { type: "error", text: "Please enter your full name." };
        state.isAuthLoading = false;
        render();
        return;
      }

      if (!/^\d{10,15}$/.test(mobile)) {
        state.authMessage = {
          type: "error",
          text: "Please enter a valid mobile number (10 to 15 digits)."
        };
        state.isAuthLoading = false;
        render();
        return;
      }

      if (!gender) {
        state.authMessage = { type: "error", text: "Please select gender." };
        state.isAuthLoading = false;
        render();
        return;
      }

      if (findUserByEmail(normalizedEmail)) {
        state.authMessage = { type: "error", text: "This email is already registered. Please login." };
        state.isAuthLoading = false;
        render();
        return;
      }

      state.users.push({
        email: normalizedEmail,
        password,
        fullName,
        mobile,
        gender
      });
      saveUsers();
      state.session = { email: normalizedEmail };
      saveSession(state.session);
      state.isAuthLoading = false;
      state.authMessage = { type: "success", text: "Registration successful." };
      render();
      return;
    }

    const user = findUserByEmail(normalizedEmail);
    if (!user || user.password !== password) {
      state.authMessage = { type: "error", text: "Invalid email or password." };
      state.isAuthLoading = false;
      render();
      return;
    }

    state.session = { email: normalizedEmail };
    saveSession(state.session);
    state.isAuthLoading = false;
    state.authMessage = { type: "success", text: "Login successful." };
    render();
  });
}

function bindDashboardEvents() {
  const bagImageInput = document.querySelector('#add-bag-form input[name="bagImage"]');
  const bagImagePreviewWrap = document.getElementById("bag-image-preview-wrap");
  const bagImagePreview = document.getElementById("bag-image-preview");

  const resetBagImagePreview = () => {
    if (bagImagePreview) {
      bagImagePreview.removeAttribute("src");
    }

    if (bagImagePreviewWrap) {
      bagImagePreviewWrap.classList.add("hidden");
    }
  };

  bagImageInput?.addEventListener("change", async (event) => {
    const selectedFile = event.target?.files?.[0];
    if (!selectedFile) {
      resetBagImagePreview();
      return;
    }

    const previewData = await fileToDataUrl(selectedFile);
    if (!previewData) {
      resetBagImagePreview();
      return;
    }

    if (bagImagePreview) {
      bagImagePreview.src = previewData;
    }

    if (bagImagePreviewWrap) {
      bagImagePreviewWrap.classList.remove("hidden");
    }
  });

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    if (state.isLogoutLoading) {
      return;
    }

    state.isLogoutLoading = true;
    render();
    await delay(500);

    state.session = null;
    saveSession(null);
    state.trackingResult = null;
    state.isLogoutLoading = false;
    render();
  });

  document.getElementById("add-bag-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.isAddingBag) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const bagName = String(formData.get("bagName") || "").trim();
    const brand = String(formData.get("brand") || "").trim();
    const color = String(formData.get("color") || "").trim();
    const destination = String(formData.get("destination") || "").trim();
    const bagImageFile = formData.get("bagImage");
    let trackingId = String(formData.get("trackingId") || "").trim().toUpperCase();

    if (!bagName || !brand || !color || !destination || !trackingId) {
      state.addBagMessage = { type: "error", text: "Please fill all fields in Add New Bag." };
      render();
      return;
    }

    if (!(bagImageFile instanceof File) || !bagImageFile.size) {
      state.addBagMessage = { type: "error", text: "Please upload a bag image." };
      render();
      return;
    }

    const exists = state.bags.some((b) => b.id.toLowerCase() === trackingId.toLowerCase());
    if (exists) {
      state.addBagMessage = { type: "error", text: "Tracking ID already exists. Use another ID." };
      render();
      return;
    }

    try {
      state.isAddingBag = true;
      state.addBagMessage = { type: "info", text: "Saving your bag details..." };
      render();

      const imageDataPromise = fileToDataUrl(bagImageFile);
      await delay(700);
      const imageData = await imageDataPromise;
      const now = nowText();
      const newBag = {
        id: trackingId,
        bagName,
        owner: normalizeEmail(state.session.email),
        imageData,
        brand,
        color,
        destination,
        status: "Processing",
        currentLocation: "Shipment Created",
        lastUpdated: now,
        events: [{ time: now, note: "Bag added to system" }]
      };

      state.bags.unshift(newBag);
      state.lastAddedBagId = trackingId;
      saveBags();
      state.addBagMessage = { type: "success", text: `Bag added successfully. Tracking ID: ${trackingId}` };
      render();

      setTimeout(() => {
        if (state.lastAddedBagId === trackingId) {
          state.lastAddedBagId = "";
          render();
        }
      }, 1600);
    } catch {
      state.addBagMessage = { type: "error", text: "Could not add the bag. Please try again." };
      render();
    } finally {
      state.isAddingBag = false;
      event.currentTarget.reset();
      resetBagImagePreview();
      render();
    }
  });

  document.getElementById("track-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.isTrackLoading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const trackingId = String(formData.get("trackingId") || "").trim().toLowerCase();

    state.isTrackLoading = true;
    render();
    await delay(650);

    const bag = bagsForCurrentUser().find((b) => b.id.toLowerCase() === trackingId);
    if (!bag) {
      state.trackingResult = {
        id: "Not Found",
        bagName: "No bag found",
        status: "Processing",
        currentLocation: "Unknown",
        destination: "Unknown",
        events: [{ time: nowText(), note: "No record for this tracking ID" }]
      };
      state.isTrackLoading = false;
      render();
      return;
    }

    state.trackingResult = bag;
    state.isTrackLoading = false;
    render();
  });

  document.getElementById("clear-track-btn")?.addEventListener("click", () => {
    state.trackingResult = null;
    render();
  });

  document.getElementById("clear-bags-btn")?.addEventListener("click", () => {
    state.confirmationDialog = {
      type: "clear-user-bags",
      title: "Clear all bags?",
      message: "This will remove all bags for your profile. Do you want to continue?"
    };
    render();
  });

  document.getElementById("delete-account-btn")?.addEventListener("click", () => {
    state.confirmationDialog = {
      type: "delete-account",
      title: "Delete your account?",
      message: "Are you sure you want to remove your account from our application? This action cannot be undone."
    };
    render();
  });

  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const status = btn.getAttribute("data-status");
      await updateBagStatus(id, status);
    });
  });

  document.querySelectorAll(".delete-bag-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      state.confirmationDialog = {
        type: "delete-one-bag",
        bagId: id,
        title: "Delete this bag?",
        message: "This bag record will be removed permanently for your account."
      };
      render();
    });
  });

  document.getElementById("confirm-no-btn")?.addEventListener("click", () => {
    state.confirmationDialog = null;
    render();
  });

  document.getElementById("confirm-overlay")?.addEventListener("click", () => {
    state.confirmationDialog = null;
    render();
  });

  document.getElementById("confirm-yes-btn")?.addEventListener("click", () => {
    applyConfirmationAction();
  });
}

function applyConfirmationAction() {
  if (!state.confirmationDialog) {
    return;
  }

  const userEmail = normalizeEmail(state.session?.email || "");

  if (state.confirmationDialog.type === "clear-user-bags") {
    state.bags = state.bags.filter((bag) => normalizeEmail(bag.owner || "") !== userEmail);
    state.trackingResult = null;
    saveBags();
  }

  if (state.confirmationDialog.type === "delete-one-bag") {
    const bagId = state.confirmationDialog.bagId;
    state.bags = state.bags.filter((bag) => bag.id !== bagId);
    if (state.trackingResult && state.trackingResult.id === bagId) {
      state.trackingResult = null;
    }
    saveBags();
  }

  if (state.confirmationDialog.type === "delete-account") {
    state.bags = state.bags.filter((bag) => normalizeEmail(bag.owner || "") !== userEmail);
    state.users = state.users.filter((user) => normalizeEmail(user.email || "") !== userEmail);

    saveBags();
    saveUsers();

    state.session = null;
    saveSession(null);
    state.trackingResult = null;
    state.authMode = "login";
    saveAuthMode(state.authMode);
    state.authMessage = { type: "success", text: "Your account has been removed successfully." };
  }

  state.confirmationDialog = null;
  render();
}

async function updateBagStatus(id, status) {
  if (!id || !status || state.statusUpdateBagId) {
    return;
  }

  const userEmail = normalizeEmail(state.session?.email || "");
  const bag = state.bags.find(
    (item) => item.id === id && normalizeEmail(item.owner || "") === userEmail
  );

  if (!bag) {
    return;
  }

  if (!canTransitionToNext(bag.status, status)) {
    state.addBagMessage = {
      type: "error",
      text: "Follow steps only: Processing -> In Transit -> Delivered"
    };
    render();
    return;
  }

  state.statusUpdateBagId = bag.id;
  state.statusUpdateTarget = status;
  state.addBagMessage = { type: "info", text: `Updating status to ${status}...` };
  render();

  await delay(900);

  bag.status = status;
  bag.lastUpdated = nowText();
  bag.currentLocation =
    status === "Delivered"
      ? "Delivered"
      : status === "In Transit"
      ? "On Route"
      : "Processing Center";

  bag.events.push({
    time: bag.lastUpdated,
    note: `Status changed to ${status}`
  });

  saveBags();

  if (state.trackingResult && state.trackingResult.id === bag.id) {
    state.trackingResult = bag;
  }

  state.addBagMessage = { type: "success", text: `Status updated: ${status}` };
  state.statusUpdateBagId = "";
  state.statusUpdateTarget = "";

  render();
}

function statusIndex(status) {
  return STATUS_FLOW.indexOf(status);
}

function canTransitionToNext(currentStatus, nextStatus) {
  const currentIndex = statusIndex(currentStatus);
  const nextIndex = statusIndex(nextStatus);

  if (currentIndex === -1 || nextIndex === -1) {
    return false;
  }

  return nextIndex === currentIndex + 1;
}

function statusBadgeClass(status) {
  if (status === "Delivered") {
    return "badge-delivered";
  }

  if (status === "In Transit") {
    return "badge-in-transit";
  }

  return "badge-processing";
}

function nowText() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function generateTrackingId() {
  let id = "";
  do {
    const rand = Math.floor(Math.random() * 9000 + 1000);
    id = `BG-${rand}`;
  } while (state.bags.some((bag) => bag.id === id));

  return id;
}

function fileToDataUrl(fileValue) {
  if (!(fileValue instanceof File) || !fileValue.size) {
    return Promise.resolve("");
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(fileValue);
  });
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getBagImage(imageData) {
  if (imageData) {
    return imageData;
  }

  return "https://images.unsplash.com/photo-1581553673739-c4906b5d0de8?auto=format&fit=crop&w=900&q=80";
}

function normalizeEmail(value) {
  return String(value).trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function antIconTemplate(name, className = "ant-icon") {
  const icons = {
    processing: "ant-design:clock-circle-filled",
    transit: "ant-design:car-filled",
    delivered: "ant-design:check-circle-filled",
    loading: "ant-design:loading-3-quarters-outlined"
  };

  return `<iconify-icon icon="${icons[name] || "ant-design:question-circle-outlined"}" class="${className}" aria-hidden="true"></iconify-icon>`;
}
