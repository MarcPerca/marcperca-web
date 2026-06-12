const canvas = document.getElementById("ambient-canvas");
const ctx = canvas.getContext("2d");
const siteHeader = document.querySelector(".site-header");
const mouse = { x: 0, y: 0, active: false };
let particles = [];
let streams = [];
let width = 0;
let height = 0;
let pixelRatio = 1;
const glyphs = "01アイウエオカキクケコサシスセソ<>/{}[]SYSNET";

function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const count = Math.min(130, Math.max(58, Math.floor((width * height) / 15000)));
    particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.15 + 0.25,
        phase: Math.random() * Math.PI * 2
    }));

    const streamCount = Math.min(72, Math.max(34, Math.floor(width / 28)));
    streams = Array.from({ length: streamCount }, (_, index) => ({
        x: (index + Math.random() * 0.55) * (width / streamCount),
        y: Math.random() * height,
        speed: 0.35 + Math.random() * 0.55,
        gap: 17 + Math.random() * 9,
        length: 8 + Math.floor(Math.random() * 15),
        alpha: 0.045 + Math.random() * 0.075,
        offset: Math.floor(Math.random() * glyphs.length)
    }));
}

function drawDataStreams(time) {
    ctx.font = "13px Consolas, 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const stream of streams) {
        stream.y += stream.speed;
        const totalLength = stream.gap * stream.length;
        if (stream.y - totalLength > height + 80) {
            stream.y = -80;
            stream.x = Math.random() * width;
        }

        for (let i = 0; i < stream.length; i += 1) {
            const y = stream.y - i * stream.gap;
            if (y < -20 || y > height + 20) continue;

            const glyphIndex = (stream.offset + i + Math.floor(time * 0.0015)) % glyphs.length;
            const fade = 1 - i / stream.length;
            const alpha = stream.alpha * fade;
            ctx.fillStyle = i === 0
                ? `rgba(230, 255, 240, ${Math.min(alpha + 0.09, 0.22)})`
                : `rgba(95, 255, 170, ${alpha})`;
            ctx.fillText(glyphs[glyphIndex], stream.x, y);
        }
    }
}

function animate(time) {
    ctx.clearRect(0, 0, width, height);
    drawDataStreams(time);

    for (const p of particles) {
        if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distance = Math.hypot(dx, dy);
                    if (distance < 150 && distance > 0.01) {
                        const force = (150 - distance) / 150;
                        p.x += (dx / distance) * force * 0.55;
                        p.y += (dy / distance) * force * 0.55;
                    }
                }

        p.x += p.vx + Math.cos(time * 0.00035 + p.phase) * 0.035;
        p.y += p.vy + Math.sin(time * 0.00032 + p.phase) * 0.035;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
    }

    for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.hypot(dx, dy);
                    if (distance < 112) {
                        const alpha = (1 - distance / 112) * 0.075;
                        ctx.strokeStyle = `rgba(175, 255, 220, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }
    }

    for (const p of particles) {
        const pulse = 0.45 + Math.sin(time * 0.001 + p.phase) * 0.22;
        ctx.fillStyle = `rgba(210, 255, 232, ${0.1 + pulse * 0.12})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    }

    if (mouse.active) {
        const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
        glow.addColorStop(0, "rgba(210, 255, 232, 0.1)");
        glow.addColorStop(0.35, "rgba(80, 180, 130, 0.045)");
        glow.addColorStop(1, "rgba(80, 180, 130, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 180, 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
window.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.active = true;

    if (siteHeader) {
        const rect = siteHeader.getBoundingClientRect();
        const x = event.clientX - rect.left;
        siteHeader.style.setProperty("--nav-x", `${x}px`);
    }
});
window.addEventListener("mouseleave", () => {
    mouse.active = false;
});

function cleanHashUrl() {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

function scrollToHashTarget(hash) {
    const target = document.querySelector(hash);
    if (!target) return false;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(cleanHashUrl, 180);
    return true;
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        if (!hash || hash === "#") {
            event.preventDefault();
            cleanHashUrl();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (scrollToHashTarget(hash)) {
            event.preventDefault();
        }
    });
});

window.addEventListener("load", () => {
    if (window.location.hash) {
        window.setTimeout(() => scrollToHashTarget(window.location.hash), 0);
    }
});

resize();
requestAnimationFrame(animate);
