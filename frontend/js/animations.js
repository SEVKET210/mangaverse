/* ============================================
   MangaVerse — Scroll Reveal & Micro-Interactions
   ============================================ */

export function initAnimations() {
  // 1. Scroll Reveal Logic (Intersection Observer)
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  // Apply reveal-up class to all sections and cards dynamically
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(sec => {
    sec.classList.add('reveal-up');
    observer.observe(sec);
  });

  // Observe dynamically loaded cards (MutationObserver for extreme detail)
  const gridObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('manga-card')) {
          node.classList.add('reveal-up');
          // Add slight delay based on index for stagger effect
          const index = Array.from(node.parentNode.children).indexOf(node);
          node.style.transitionDelay = `${(index % 10) * 0.05}s`;
          observer.observe(node);
        }
      });
    });
  });

  const grids = document.querySelectorAll('.manga-grid, .rec-grid, .hero-grid, .sidebar-cat-grid');
  grids.forEach(grid => {
    gridObserver.observe(grid, { childList: true });
  });

  // 2. Parallax Hero Image (Mouse Move)
  const heroSlideInfos = document.querySelectorAll('.hero-slide-inner');
  heroSlideInfos.forEach(hero => {
    hero.addEventListener('mousemove', (e) => {
      const img = hero.querySelector('.hero-slide-cover img');
      if (!img) return;
      
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      
      img.style.transform = `translate(${x}px, ${y}px) scale(1.05) rotate(${x * 0.2}deg)`;
    });
    
    hero.addEventListener('mouseleave', () => {
      const img = hero.querySelector('.hero-slide-cover img');
      if (img) img.style.transform = `translate(0px, 0px) scale(1) rotate(0deg)`;
    });
  });

  // 3. MangaVerse Signature Effect: Floating Ink / Sakura Particles
  initMangaParticles();
}

function initMangaParticles() {
  const heroWrapper = document.querySelector('.hero-slide');
  if (!heroWrapper) return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1';
  canvas.style.opacity = '0.4';
  
  // Insert behind the content but inside the hero wrapper
  heroWrapper.insertBefore(canvas, heroWrapper.firstChild);

  const ctx = canvas.getContext('2d');
  let particles = [];
  
  const resize = () => {
    canvas.width = heroWrapper.offsetWidth;
    canvas.height = heroWrapper.offsetHeight;
  };
  
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedY = Math.random() * 1 + 0.5;
      this.speedX = Math.random() * 1 - 0.5;
      // Soft lavender/ink colors
      const colors = ['rgba(139, 92, 246, 0.6)', 'rgba(167, 139, 250, 0.4)', 'rgba(255, 255, 255, 0.3)'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      if (this.y < -10) {
        this.y = canvas.height + 10;
        this.x = Math.random() * canvas.width;
      }
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 40; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  
  animate();
}
