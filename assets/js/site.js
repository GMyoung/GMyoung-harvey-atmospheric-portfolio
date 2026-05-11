const body = document.body;
const showcase = document.getElementById("showcase");
const counter = document.getElementById("counter");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
const navItems = Array.from(document.querySelectorAll(".timeline-row"));
const sections = Array.from(document.querySelectorAll(".case-section"));
const ticks = Array.from(document.querySelectorAll(".tick"));
const canvas = document.getElementById("atmosphere-canvas");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let dpr = 1;
let mode = "day";
let rafId = null;
let rainDrops = [];
let stars = [];
let splashes = [];

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildParticles();
}

function buildParticles() {
  rainDrops = [];
  splashes = [];
  stars = [];

  const rainLayers = [
    { count: 95, speed: 18, length: 24, alpha: 0.34, width: 1.15 },
    { count: 120, speed: 12, length: 15, alpha: 0.2, width: 0.75 },
    { count: 90, speed: 8, length: 9, alpha: 0.12, width: 0.5 }
  ];

  rainLayers.forEach((layer) => {
    for (let i = 0; i < layer.count; i += 1) {
      rainDrops.push({
        x: Math.random() * (width + 120) - 60,
        y: Math.random() * height,
        speed: layer.speed + Math.random() * layer.speed * 0.55,
        length: layer.length + Math.random() * layer.length * 0.45,
        alpha: layer.alpha * (0.6 + Math.random() * 0.55),
        width: layer.width,
        drift: 1.4 + Math.random() * 1.2
      });
    }
  });

  const starColors = [
    [210, 222, 244],
    [244, 239, 218],
    [185, 205, 241],
    [238, 210, 188]
  ];

  for (let i = 0; i < 150; i += 1) {
    const color = starColors[Math.floor(Math.random() * starColors.length)];
    const bright = Math.random() > 0.88;
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.68,
      radius: bright ? 1.15 + Math.random() * 1.2 : 0.35 + Math.random() * 0.75,
      alpha: bright ? 0.45 + Math.random() * 0.35 : 0.12 + Math.random() * 0.28,
      phase: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.7,
      color
    });
  }
}

function setMode(nextMode) {
  mode = nextMode;
  body.classList.remove("mode-day", "mode-sunny", "mode-rain", "mode-moon");
  body.classList.add(`mode-${mode}`);

  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (mode === "rain" || mode === "moon") {
    startCanvas();
  } else {
    stopCanvas();
  }
}

function startCanvas() {
  if (rafId) return;
  rafId = requestAnimationFrame(drawFrame);
}

function stopCanvas() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  ctx.clearRect(0, 0, width, height);
}

function drawFrame(time) {
  ctx.clearRect(0, 0, width, height);

  if (mode === "rain") {
    drawRain();
  }

  if (mode === "moon") {
    drawStars(time);
  }

  rafId = requestAnimationFrame(drawFrame);
}

function drawRain() {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(39, 47, 57, 0.22)");
  gradient.addColorStop(0.7, "rgba(58, 70, 82, 0.1)");
  gradient.addColorStop(1, "rgba(28, 34, 42, 0.18)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  rainDrops.forEach((drop) => {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x + drop.drift * 2.1, drop.y + drop.length);
    ctx.strokeStyle = `rgba(216, 229, 239, ${drop.alpha})`;
    ctx.lineWidth = drop.width;
    ctx.lineCap = "round";
    ctx.stroke();

    drop.x += drop.drift;
    drop.y += drop.speed;

    if (drop.y > height + drop.length) {
      if (drop.width > 1 && Math.random() > 0.72) {
        splashes.push({
          x: drop.x,
          y: height - 6 + Math.random() * 7,
          radius: 0,
          life: 0,
          maxLife: 12 + Math.random() * 8
        });
      }
      drop.x = Math.random() * (width + 120) - 60;
      drop.y = -drop.length - Math.random() * 80;
    }
  });

  for (let i = splashes.length - 1; i >= 0; i -= 1) {
    const splash = splashes[i];
    splash.life += 1;
    splash.radius = (splash.life / splash.maxLife) * 8;
    const alpha = 0.22 * (1 - splash.life / splash.maxLife);

    if (alpha <= 0) {
      splashes.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.ellipse(splash.x, splash.y, splash.radius * 1.8, splash.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(221, 235, 246, ${alpha})`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  const fog = ctx.createRadialGradient(width * 0.48, height * 0.96, 0, width * 0.48, height * 0.96, width * 0.65);
  fog.addColorStop(0, "rgba(212, 223, 232, 0.11)");
  fog.addColorStop(1, "rgba(212, 223, 232, 0)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, width, height);
}

function drawStars(time) {
  const seconds = time * 0.001;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "rgba(6, 10, 17, 0.42)");
  sky.addColorStop(1, "rgba(6, 10, 17, 0)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  stars.forEach((star) => {
    const twinkle = Math.sin(star.phase + seconds * star.speed) * 0.22;
    const alpha = Math.max(0.03, star.alpha + twinkle);
    const [r, g, b] = star.color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fill();

    if (star.radius > 1.2) {
      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4);
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.22})`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function updateActiveSection() {
  const viewportHeight = window.innerHeight;
  const scrollTop = showcase ? showcase.scrollTop : window.scrollY;
  let activeIndex = 0;

  sections.forEach((section, index) => {
    const top = section.offsetTop - (showcase ? showcase.offsetTop : 0);
    if (scrollTop >= top - viewportHeight * 0.42) {
      activeIndex = index;
    }
  });

  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.section === sections[activeIndex].id);
  });

  ticks.forEach((tick, index) => {
    tick.classList.toggle("active", index === activeIndex);
  });

  counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(sections.length).padStart(2, "0")}`;
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

navItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.getElementById(item.dataset.section);
    if (target && showcase) {
      showcase.scrollTo({
        top: target.offsetTop - showcase.offsetTop,
        behavior: "smooth"
      });
    } else if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

window.addEventListener("resize", resizeCanvas);
if (showcase) {
  showcase.addEventListener("scroll", updateActiveSection, { passive: true });
} else {
  window.addEventListener("scroll", updateActiveSection, { passive: true });
}

document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  const key = event.key.toLowerCase();
  if (key === "d") setMode("day");
  if (key === "s") setMode("sunny");
  if (key === "r") setMode("rain");
  if (key === "m") setMode("moon");
});

resizeCanvas();
updateActiveSection();
