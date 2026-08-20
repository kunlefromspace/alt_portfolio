// Nav scroll state
const nav = document.getElementById("siteNav");
const onScroll = () => {
  if (window.scrollY > 20) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
};
document.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const navMobile = document.getElementById("navMobile");
navToggle.addEventListener("click", () => {
  const open = navMobile.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  navToggle.textContent = open ? "✕" : "☰";
});
navMobile.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navMobile.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.textContent = "☰";
  }),
);

// Trace draw-in animation
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
["traceA", "traceB"].forEach((id, i) => {
  const path = document.getElementById(id);
  if (!path) return;
  if (reduceMotion) {
    return;
  }
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  path.getBoundingClientRect(); // force reflow
  path.style.transition = `stroke-dashoffset ${1.6 + i * 0.3}s cubic-bezier(0.22,0.61,0.36,1) ${i * 0.15}s`;
  requestAnimationFrame(() => {
    path.style.strokeDashoffset = "0";
  });
});

// Scroll reveal
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// Contact modal
const overlay = document.getElementById("contactOverlay");
const openBtn = document.getElementById("openContact");
const closeBtn = document.getElementById("closeContact");
const cancelBtn = document.getElementById("cancelContact");
const contactForm = document.getElementById("contactForm");
const statusEl = document.getElementById("contactStatus");
let lastFocused = null;

function onModalKeydown(e) {
  if (e.key === "Escape") {
    closeModal();
    return;
  }
  if (e.key === "Tab") {
    const focusable = overlay.querySelectorAll("button, input, textarea");
    const first = focusable[0],
      last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
function openModal() {
  lastFocused = document.activeElement;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("cf-name").focus();
  document.addEventListener("keydown", onModalKeydown);
}
function closeModal() {
  overlay.hidden = true;
  document.body.style.overflow = "";
  document.removeEventListener("keydown", onModalKeydown);
  if (lastFocused) {
    lastFocused.focus();
  }
}

openBtn.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    closeModal();
  }
});

contactForm.addEventListener("submit", async (e) => { // 1. Added 'async' here
  e.preventDefault();
  
  const name = document.getElementById("cf-name").value.trim();
  const email = document.getElementById("cf-email").value.trim();
  const message = document.getElementById("cf-message").value.trim();
  
  if (!name || !email || !message) {
    return;
  }

  statusEl.textContent = "Sending your message..."; // 2. Updated text indicator

  try {
    // 3. Fire the data directly to your Express route
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, message })
    });

    const data = await response.json();

    if (response.ok) {
      statusEl.textContent = "Message sent successfully!";
    } else {
      // Handles server errors or rate limit errors (429 status code)
      statusEl.textContent = data.error || "Failed to send message.";
    }

  } catch (error) {
    console.error("Network error:", error);
    statusEl.textContent = "Server error. Please try again later.";
  }

  // 4. Keeps your visual closing and scrolling animations running smoothly
  setTimeout(() => {
    contactForm.reset();
    statusEl.textContent = "";
    closeModal();
    history.replaceState(null, "", "#hero");
    document
      .getElementById("hero")
      .scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, 2500); // Increased timeout slightly so users can read the status message
});
