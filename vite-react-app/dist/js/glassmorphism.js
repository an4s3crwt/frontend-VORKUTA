export function initGlassmorphismEffects() {
  const particles = document.querySelector(".particles");

  if (!particles) return;

  function createParticle() {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = Math.random() * 3 + 2 + "s";
    particles.appendChild(particle);

    particle.addEventListener("animationend", () => {
      particle.remove();
    });
  }

  setInterval(createParticle, 100);

  const blobs = document.querySelectorAll(".blob");
  blobs.forEach((blob, index) => {
    blob.style.animationDelay = `${index * 5}s`;
  });

  document.addEventListener("mousemove", (e) => {
    const glassCard = document.querySelector(".glass-card");
    if (!glassCard) return;

    const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
    glassCard.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
  });
}
