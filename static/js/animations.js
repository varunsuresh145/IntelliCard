/* ============================================================
   INTELLICARD AI — MOTION & VISUAL INTERACTION
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMouseParallax();
  initIntersectionObserver();
  initParticleCanvas();
  initHeroCardFlipper();
});

/**
 * Applies subtle mouse-movement parallax to the floating background glass orbs
 */
function initMouseParallax() {
  const orbs = document.querySelectorAll('.orb');
  if (orbs.length === 0) return;

  window.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;

    orbs.forEach((orb, i) => {
      // Different speed parameters for varied depths
      const factor = (i + 1) * 30;
      const x = mouseX * factor;
      const y = mouseY * factor;
      
      // Merge parallax shifts with float animations
      orb.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
}

/**
 * Auto-triggers fade-in animations when elements enter the screen viewport
 */
function initIntersectionObserver() {
  const elements = document.querySelectorAll('.fade-in, .fade-up, .fade-left, .fade-right, .hover-lift');
  if (elements.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Trigger only once
      }
    });
  }, observerOptions);

  elements.forEach(el => {
    observer.observe(el);
  });
}

// Inject class definitions for visibility trigger transitions
const animStyles = document.createElement('style');
animStyles.innerHTML = `
.fade-in { opacity: 0; transition: opacity 0.8s ease; }
.fade-in.visible { opacity: 1; }

.fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-up.visible { opacity: 1; transform: translateY(0); }

.delay-1 { transition-delay: 0.1s; }
.delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; }
.delay-4 { transition-delay: 0.4s; }
.delay-5 { transition-delay: 0.5s; }
`;
document.head.appendChild(animStyles);

/* ─── DYNAMIC HERO FLASHCARD CYCLE ────────────────────────── */
const MOCK_CARDS = [
  {
    question: "What is the main advantage of Groq Llama-3 API?",
    answer: "It offers ultra-fast inference speeds, allowing educational flashcards to be generated in real-time."
  },
  {
    question: "Explain 'active recall' study methodology.",
    answer: "Testing your memory by retrieving information rather than passive review. It dramatically boosts retention."
  },
  {
    question: "What does the 4-level segmentation engine do?",
    answer: "It parses documents hierarchically, using fonts, bold styles, AI, or pages to split content cleanly."
  }
];

let currentCardIdx = 0;
let autoFlipInterval = null;
let cardIsFlipped = false;
let userInteracted = false;

function initHeroCardFlipper() {
  const cardElement = document.getElementById('hero-preview-card');
  if (!cardElement) return;

  // Set initial content
  updateHeroCardContent();

  // Start auto flip-cycle
  startAutoFlipCycle();
}

function updateHeroCardContent() {
  const qEl = document.getElementById('hero-card-question');
  const aEl = document.getElementById('hero-card-answer');
  const cardData = MOCK_CARDS[currentCardIdx];
  
  if (qEl && aEl && cardData) {
    qEl.textContent = cardData.question;
    aEl.textContent = cardData.answer;
  }
}

function flipHeroCard() {
  const cardElement = document.getElementById('hero-preview-card');
  if (!cardElement) return;

  userInteracted = true;
  clearInterval(autoFlipInterval); // Stop auto cycling on user click

  cardIsFlipped = !cardIsFlipped;
  if (cardIsFlipped) {
    cardElement.classList.add('is-flipped');
  } else {
    cardElement.classList.remove('is-flipped');
    // Rotate to next card when flipping back to front
    setTimeout(() => {
      currentCardIdx = (currentCardIdx + 1) % MOCK_CARDS.length;
      updateHeroCardContent();
    }, 250);
  }
}

function startAutoFlipCycle() {
  const cardElement = document.getElementById('hero-preview-card');
  if (!cardElement) return;

  autoFlipInterval = setInterval(() => {
    if (userInteracted) return;

    cardIsFlipped = !cardIsFlipped;
    if (cardIsFlipped) {
      cardElement.classList.add('is-flipped');
    } else {
      cardElement.classList.remove('is-flipped');
      // Rotate card index
      setTimeout(() => {
        currentCardIdx = (currentCardIdx + 1) % MOCK_CARDS.length;
        updateHeroCardContent();
      }, 250);
    }
  }, 4500);
}

/* ─── INTERACTIVE PARTICLE CANVAS BACKGROUND ───────────────── */
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: null, y: null, radius: 140 };

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Particle Class
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 1.5 + 0.8;
      this.speedX = Math.random() * 0.4 - 0.2;
      this.speedY = Math.random() * 0.4 - 0.2;
      this.baseColor = Math.random() > 0.5 ? 'rgba(0, 212, 255, 0.4)' : 'rgba(168, 85, 247, 0.4)';
    }

    update() {
      // Regular movement
      this.x += this.speedX;
      this.y += this.speedY;

      // Bounce off walls
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

      // Mouse interactive attract/repel
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          this.x -= dx * force * 0.02;
          this.y -= dy * force * 0.02;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.baseColor;
      ctx.fill();
    }
  }

  // Populate particles list
  function setupParticles() {
    particles = [];
    // Relative density based on window size
    const quantity = Math.floor((canvas.width * canvas.height) / 14000);
    const maxLimit = Math.min(quantity, 90); // Cap at 90 nodes for layout performance
    
    for (let i = 0; i < maxLimit; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push(new Particle(x, y));
    }
  }
  setupParticles();
  window.addEventListener('resize', setupParticles);

  // Draw lines connecting nearby particles
  function drawConnections() {
    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 95) {
          // Transparency depends on distance
          const opacity = (1 - distance / 95) * 0.08;
          ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }
  }

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw and update all nodes
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawConnections();
    requestAnimationFrame(animate);
  }
  
  animate();
}
