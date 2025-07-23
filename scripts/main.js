// scripts/main.js

// Registrar plugin GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ===== SISTEMA DE TRANSIÇÕES ENTRE PÁGINAS =====
class PageTransitions {
  constructor() {
    this.isTransitioning = false;
    this.init();
  }

  init() {
    // Animação de entrada da página
    this.animatePageIn();
    this.bindNavigationEvents();
  }

  animatePageIn() {
    const tl = gsap.timeline();

    // Fade in do conteúdo principal
    tl.fromTo('main, header', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    )
    .fromTo('nav', 
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4"
    )
    .fromTo('.card, .publication-thumb', 
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.3"
    );
  }

  bindNavigationEvents() {
    const links = document.querySelectorAll("nav a.nav-link");

    links.forEach(link => {
      link.addEventListener("click", (e) => {
        if (this.isTransitioning) {
          e.preventDefault();
          return;
        }

        const href = link.getAttribute('href');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        // Se for a mesma página, apenas atualiza o estado ativo
        if (href === currentPage) {
          this.updateActiveState(link);
          e.preventDefault();
          return;
        }

        // Caso contrário, executa transição
        e.preventDefault();
        this.transitionToPage(href, link);
      });
    });
  }

  updateActiveState(activeLink) {
    document.querySelectorAll("nav a.nav-link").forEach(l => l.classList.remove("active"));
    activeLink.classList.add("active");
  }

  transitionToPage(href, activeLink) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.updateActiveState(activeLink);

    const tl = gsap.timeline({
      onComplete: () => {
        window.location.href = href;
      }
    });

    // Animação de saída
    tl.to('.card, .publication-thumb', {
      opacity: 0, 
      scale: 0.9, 
      y: -20, 
      duration: 0.3, 
      stagger: 0.05, 
      ease: "power2.in"
    })
    .to('main, header', {
      opacity: 0, 
      y: -30, 
      duration: 0.4, 
      ease: "power2.in"
    }, "-=0.2")
    .to('nav', {
      opacity: 0.7, 
      duration: 0.3, 
      ease: "power2.in"
    }, "-=0.3");
  }
}

// ===== TEXTURA DE FUNDO INTERATIVA 3D =====
class InteractiveBackground {
  constructor() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;

    // Verificar preferências de movimento reduzido
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.prefersReducedMotion) {
      this.canvas.style.opacity = '0.3';
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.dataNodes = [];
    this.connections = [];
    this.mousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.mouseVelocity = { x: 0, y: 0 };
    this.lastMousePosition = { x: 0, y: 0 };
    this.connectionDistance = 140;
    this.mouseInfluenceRadius = 180;
    this.time = 0;
    this.isVisible = true;
    this.animationId = null;

    this.init();
    this.animate();
    this.bindEvents();
  }

  init() {
    this.resizeCanvas();
    this.createParticles();
    this.createDataNodes();
    this.createHolographicLayer();
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';

    this.ctx.scale(dpr, dpr);

    // Garantir que o canvas ocupe toda a viewport
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '-1';
    this.canvas.style.pointerEvents = 'none';
  }

  createParticles() {
    const isMobile = window.innerWidth < 768;
    const isLowPerformance = navigator.hardwareConcurrency <= 4 || window.innerWidth < 1024;
    const particleCount = Math.floor((this.canvas.width * this.canvas.height) / (isMobile ? 20000 : isLowPerformance ? 15000 : 10000));
    this.particles = [];

    // Cores da paleta AEther com variações 3D
    const colors = [
      { hue: 175, sat: 50, light: 80, depth: Math.random() }, // Mineral Mint
      { hue: 180, sat: 40, light: 70, depth: Math.random() }, // Variação mint
      { hue: 170, sat: 45, light: 85, depth: Math.random() }, // Mint claro
      { hue: 15, sat: 55, light: 78, depth: Math.random() },  // Discreet Salmon
      { hue: 200, sat: 25, light: 75, depth: Math.random() }, // Rainy Grey
      { hue: 190, sat: 35, light: 82, depth: Math.random() }  // Mint secondary
    ];

    for (let i = 0; i < particleCount; i++) {
      const colorChoice = colors[Math.floor(Math.random() * colors.length)];
      const depth = Math.random();
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        z: depth * 100, // Coordenada Z para efeito 3D
        originalX: 0,
        originalY: 0,
        originalZ: depth * 100,
        vx: (Math.random() - 0.5) * (1.5 + depth),
        vy: (Math.random() - 0.5) * (1.5 + depth),
        vz: (Math.random() - 0.5) * 0.5,
        size: (Math.random() * 2.5 + 0.8) * (0.5 + depth * 0.5),
        alpha: Math.random() * 0.9 + 0.3,
        color: colorChoice,
        pulseOffset: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        rotation: 0,
        type: Math.random() > 0.75 ? 'data-node' : 'particle',
        depth: depth
      });
    }

    // Definir posições originais
    this.particles.forEach(particle => {
      particle.originalX = particle.x;
      particle.originalY = particle.y;
    });
  }

  createDataNodes() {
    const nodeCount = Math.floor(this.particles.length / 12);
    this.dataNodes = [];

    for (let i = 0; i < nodeCount; i++) {
      this.dataNodes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        z: Math.random() * 50 + 50,
        size: Math.random() * 4 + 2,
        alpha: Math.random() * 0.8 + 0.5,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        glowIntensity: Math.random() * 0.6 + 0.4,
        orbitRadius: Math.random() * 30 + 20,
        orbitSpeed: (Math.random() - 0.5) * 0.01,
        orbitAngle: Math.random() * Math.PI * 2
      });
    }
  }

  createHolographicLayer() {
    // Adicionar camada holográfica ao DOM
    const holographicLayer = document.createElement('div');
    holographicLayer.className = 'holographic-layer';
    holographicLayer.style.position = 'absolute';
    holographicLayer.style.top = '0';
    holographicLayer.style.left = '0';
    holographicLayer.style.width = '100%';
    holographicLayer.style.height = '100%';
    holographicLayer.style.zIndex = '-2';
    holographicLayer.style.pointerEvents = 'none';

    const backgroundTexture = document.getElementById('background-texture');
    if (backgroundTexture) {
      backgroundTexture.appendChild(holographicLayer);
    }
  }

  updateParticles() {
    this.time += 0.018;

    // Calcular velocidade do mouse
    this.mouseVelocity.x = this.mousePosition.x - this.lastMousePosition.x;
    this.mouseVelocity.y = this.mousePosition.y - this.lastMousePosition.y;
    this.lastMousePosition.x = this.mousePosition.x;
    this.lastMousePosition.y = this.mousePosition.y;

    this.particles.forEach((particle, index) => {
      // Movimento 3D das partículas
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;
      particle.rotation += particle.rotationSpeed;

      // Limites 3D
      if (particle.x < 0 || particle.x > this.canvas.width) {
        particle.vx *= -0.8;
        particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
      }
      if (particle.y < 0 || particle.y > this.canvas.height) {
        particle.vy *= -0.8;
        particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
      }
      if (particle.z < 0 || particle.z > 100) {
        particle.vz *= -0.8;
        particle.z = Math.max(0, Math.min(100, particle.z));
      }

      // Interação com cursor - efeito 3D aprimorado
      const dx = this.mousePosition.x - particle.x;
      const dy = this.mousePosition.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.mouseInfluenceRadius) {
        const force = (this.mouseInfluenceRadius - distance) / this.mouseInfluenceRadius;
        const angle = Math.atan2(dy, dx);

        // Repulsão 3D mais dinâmica
        const mouseSpeed = Math.sqrt(this.mouseVelocity.x ** 2 + this.mouseVelocity.y ** 2);
        const repulsion = force * (1.2 + mouseSpeed * 0.15);
        const depthEffect = 1 + particle.depth * 0.5;

        particle.vx -= Math.cos(angle) * repulsion * 0.4 * depthEffect;
        particle.vy -= Math.sin(angle) * repulsion * 0.4 * depthEffect;
        particle.vz += force * 2;

        // Efeitos visuais intensificados
        particle.alpha = Math.min(1, particle.alpha + force * 0.5);
        particle.size = Math.max(particle.size, (1 + force * 3) * (0.5 + particle.depth * 0.5));
        particle.rotationSpeed += force * 0.02;
      } else {
        // Retorno gradual
        particle.alpha *= 0.985;
        particle.size *= 0.992;
        particle.rotationSpeed *= 0.98;
        particle.alpha = Math.max(0.3, particle.alpha);
        particle.size = Math.max(0.8 * (0.5 + particle.depth * 0.5), particle.size);
      }

      // Movimento orbital sutil baseado na profundidade
      const orbitalForce = 0.001 * particle.depth;
      particle.x += Math.cos(this.time * 0.5 + index * 0.1) * orbitalForce * 20;
      particle.y += Math.sin(this.time * 0.5 + index * 0.1) * orbitalForce * 20;

      // Pulsação 3D
      const pulse = Math.sin(this.time * 2.5 + particle.pulseOffset) * 0.15;
      particle.size += pulse * (1 + particle.depth);

      // Atração à posição original com efeito de profundidade
      const returnForce = 0.003 * (1 + particle.depth * 0.5);
      particle.vx += (particle.originalX - particle.x) * returnForce;
      particle.vy += (particle.originalY - particle.y) * returnForce;
      particle.vz += (particle.originalZ - particle.z) * returnForce * 0.1;

      // Damping aprimorado
      particle.vx *= 0.985;
      particle.vy *= 0.985;
      particle.vz *= 0.99;
    });

    // Atualizar nós de dados com movimento orbital
    this.dataNodes.forEach(node => {
      node.orbitAngle += node.orbitSpeed;
      node.x += Math.cos(node.orbitAngle) * 0.5;
      node.y += Math.sin(node.orbitAngle) * 0.5;
    });
  }

  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Desenhar conexões primeiro
    this.drawConnections();

    // Ordenar partículas por profundidade para renderização correta
    const sortedParticles = [...this.particles].sort((a, b) => a.z - b.z);

    sortedParticles.forEach(particle => {
      this.ctx.save();

      const { hue, sat, light } = particle.color;
      const depthScale = 0.3 + (particle.z / 100) * 0.7; // Escala baseada na profundidade
      const perspectiveX = particle.x + (particle.x - this.canvas.width / 2) * (particle.z / 1000);
      const perspectiveY = particle.y + (particle.y - this.canvas.height / 2) * (particle.z / 1000);

      this.ctx.translate(perspectiveX, perspectiveY);
      this.ctx.rotate(particle.rotation);
      this.ctx.scale(depthScale, depthScale);

      if (particle.type === 'data-node') {
        // Nós de dados 3D especiais
        const pulse = Math.sin(this.time * 4 + particle.pulseOffset) * 0.4 + 0.8;
        const nodeSize = particle.size * (1.8 + pulse * 0.6);

        // Múltiplas camadas de glow para efeito 3D
        for (let i = 5; i >= 1; i--) {
          const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, nodeSize * i);
          const intensity = (6 - i) / 5;
          gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${particle.alpha * pulse * intensity})`);
          gradient.addColorStop(0.3, `hsla(${hue}, ${sat}%, ${light}%, ${particle.alpha * 0.3 * intensity})`);
          gradient.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);

          this.ctx.beginPath();
          this.ctx.arc(0, 0, nodeSize * i, 0, Math.PI * 2);
          this.ctx.fillStyle = gradient;
          this.ctx.fill();
        }

        // Núcleo cristalino
        this.ctx.beginPath();
        this.ctx.arc(0, 0, nodeSize * 0.6, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${hue}, ${Math.min(100, sat + 25)}%, ${Math.min(100, light + 20)}%, ${particle.alpha})`;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, 0.8)`;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

      } else {
        // Partículas normais com efeito 3D
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size * 3);
        gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${particle.alpha})`);
        gradient.addColorStop(0.4, `hsla(${hue}, ${Math.max(0, sat - 15)}%, ${Math.max(0, light - 15)}%, ${particle.alpha * 0.7})`);
        gradient.addColorStop(1, `hsla(${hue}, ${Math.max(0, sat - 30)}%, ${Math.max(0, light - 30)}%, 0)`);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Núcleo brilhante
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${hue}, ${Math.min(100, sat + 15)}%, ${Math.min(100, light + 15)}%, ${particle.alpha})`;
        this.ctx.fill();
      }

      this.ctx.restore();
    });

    // Desenhar nós de dados orbitais
    this.drawDataNodes();
  }

  drawConnections() {
    this.particles.forEach((particle, i) => {
      for (let j = i + 1; j < this.particles.length; j++) {
        const other = this.particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const dz = particle.z - other.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.1);

        if (distance < this.connectionDistance) {
          const opacity = (this.connectionDistance - distance) / this.connectionDistance;
          const midX = (particle.x + other.x) / 2;
          const midY = (particle.y + other.y) / 2;
          const avgDepth = (particle.z + other.z) / 200;

          // Efeito do cursor
          const cursorDist = Math.sqrt(
            (this.mousePosition.x - midX) ** 2 + (this.mousePosition.y - midY) ** 2
          );
          const cursorEffect = Math.max(0, 1 - cursorDist / this.mouseInfluenceRadius);

          const finalOpacity = opacity * (0.2 + cursorEffect * 0.5) * (0.3 + avgDepth);
          const lineWidth = (0.5 + cursorEffect * 2) * (0.5 + avgDepth);

          // Gradiente para conexão 3D
          const gradient = this.ctx.createLinearGradient(particle.x, particle.y, other.x, other.y);
          gradient.addColorStop(0, `rgba(179, 227, 215, ${finalOpacity})`);
          gradient.addColorStop(0.5, `rgba(179, 227, 215, ${finalOpacity * 1.5})`);
          gradient.addColorStop(1, `rgba(245, 192, 181, ${finalOpacity * 0.8})`);

          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = gradient;
          this.ctx.lineWidth = lineWidth;
          this.ctx.stroke();
        }
      }
    });
  }

  drawDataNodes() {
    this.dataNodes.forEach(node => {
      const pulse = Math.sin(this.time * 100 * node.pulseSpeed) * 0.4 + 0.8;
      const glowSize = node.size * (3 + node.glowIntensity * pulse);

      // Efeito de glow multicamada
      for (let i = 3; i >= 1; i--) {
        const gradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize * i);
        const intensity = (4 - i) / 3;
        gradient.addColorStop(0, `rgba(179, 227, 215, ${node.alpha * pulse * intensity})`);
        gradient.addColorStop(0.5, `rgba(179, 227, 215, ${node.alpha * 0.3 * intensity})`);
        gradient.addColorStop(1, 'rgba(179, 227, 215, 0)');

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, glowSize * i, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      }

      // Núcleo do nó
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(179, 227, 215, ${node.alpha})`;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = 'rgba(179, 227, 215, 0.8)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }

  animate() {
    if (!this.isVisible || this.prefersReducedMotion) return;

    this.updateParticles();
    this.drawParticles();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  pause() {
    this.isVisible = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  resume() {
    this.isVisible = true;
    if (!this.prefersReducedMotion) {
      this.animate();
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.createParticles();
      this.createDataNodes();
    });

    document.addEventListener('mousemove', (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });

    // Efeito especial no clique - versão 3D
    document.addEventListener('click', (e) => {
      this.createClickEffect(e.clientX, e.clientY);
    });

    // Pausar animação quando não visível
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });

    // Interação com teclado para acessibilidade
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        this.createClickEffect(this.mousePosition.x, this.mousePosition.y);
      }
    });
  }

  createClickEffect(x, y) {
    // Ondas de expansão 3D
    const waves = 4;
    for (let i = 0; i < waves; i++) {
      setTimeout(() => {
        this.particles.forEach(particle => {
          const dx = x - particle.x;
          const dy = y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 250) {
            const force = (250 - distance) / 250;
            const angle = Math.atan2(dy, dx);
            const depthMultiplier = 1 + particle.depth * 2;

            particle.vx -= Math.cos(angle) * force * 3 * depthMultiplier;
            particle.vy -= Math.sin(angle) * force * 3 * depthMultiplier;
            particle.vz += force * 5;
            particle.alpha = Math.min(1, particle.alpha + force * 0.8);
            particle.rotationSpeed += force * 0.05;
          }
        });
      }, i * 120);
    }
  }
}

// ===== SISTEMA DE PARTÍCULAS 3D OTIMIZADO =====
class ParticleSystem {
  constructor() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = window.innerWidth > 768 ? 80 : 40;
    this.mousePosition = { x: 0, y: 0 };
    this.lastMousePosition = { x: 0, y: 0 };
    this.mouseVelocity = { x: 0, y: 0 };
    this.mouseInfluenceRadius = 120;
    this.time = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '-1';
    this.canvas.style.pointerEvents = 'none';
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        z: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.8 + 0.2,
        color: Math.random() > 0.5 ? '#B3E3D7' : '#F5C0B5',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.maxParticles = window.innerWidth > 768 ? 80 : 40;
      if (this.particles.length > this.maxParticles) {
        this.particles = this.particles.slice(0, this.maxParticles);
      } else if (this.particles.length < this.maxParticles) {
        const diff = this.maxParticles - this.particles.length;
        for (let i = 0; i < diff; i++) {
          this.particles.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            z: Math.random() * 100,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            vz: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.8 + 0.2,
            color: Math.random() > 0.5 ? '#B3E3D7' : '#F5C0B5',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02
          });
        }
      }
    });

    document.addEventListener('mousemove', (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.time += 0.018;

    this.mouseVelocity.x = this.mousePosition.x - this.lastMousePosition.x;
    this.mouseVelocity.y = this.mousePosition.y - this.lastMousePosition.y;
    this.lastMousePosition.x = this.mousePosition.x;
    this.lastMousePosition.y = this.mousePosition.y;

    this.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;
      particle.rotation += particle.rotationSpeed;

      if (particle.x < 0 || particle.x > this.canvas.width) {
        particle.vx *= -0.8;
        particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
      }
      if (particle.y < 0 || particle.y > this.canvas.height) {
        particle.vy *= -0.8;
        particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
      }
      if (particle.z < 0 || particle.z > 100) {
        particle.vz *= -0.8;
        particle.z = Math.max(0, Math.min(100, particle.z));
      }

      const dx = this.mousePosition.x - particle.x;
      const dy = this.mousePosition.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.mouseInfluenceRadius) {
        const force = (this.mouseInfluenceRadius - distance) / this.mouseInfluenceRadius;
        const angle = Math.atan2(dy, dx);
        particle.vx += Math.cos(angle) * force * 0.02;
        particle.vy += Math.sin(angle) * force * 0.02;
      }

      const scale = 1 + (particle.z / 100) * 0.5;
      const currentAlpha = particle.alpha * (1 - particle.z / 100 * 0.3);

      this.ctx.save();
      this.ctx.globalAlpha = currentAlpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * scale, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    requestAnimationFrame(() => this.animate());
  }
}

// Sistema de Loading Global
class LoadingManager {
  constructor() {
    this.isLoading = false;
    this.loadingOverlay = null;
    this.init();
  }

  init() {
    this.createLoadingOverlay();
    this.bindVisibilityEvents();
  }

  createLoadingOverlay() {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'loading-overlay';
    this.loadingOverlay.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner-advanced"></div>
        <div class="loading-text">Carregando experiência AEther...</div>
        <div class="loading-progress">
          <div class="loading-progress-bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.loadingOverlay);
  }

  show() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.loadingOverlay.style.display = 'flex';
    gsap.fromTo(this.loadingOverlay, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.3 }
    );
    this.animateProgress();
  }

  hide() {
    if (!this.isLoading) return;
    gsap.to(this.loadingOverlay, {
      opacity: 0,
      duration: 0.4,
      onComplete: () => {
        this.loadingOverlay.style.display = 'none';
        this.isLoading = false;
      }
    });
  }

  animateProgress() {
    const progressBar = this.loadingOverlay.querySelector('.loading-progress-bar');
    gsap.to(progressBar, {
      width: '100%',
      duration: 2,
      ease: "power2.out"
    });
  }

  bindVisibilityEvents() {
    window.addEventListener('beforeunload', () => this.show());
    window.addEventListener('load', () => this.hide());
  }
}

// ===== SISTEMA DE MICROINTERAÇÕES =====
class MicroInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.setupCardInteractions();
    this.setupButtonRipples();
    this.setupNavFeedback();
    this.setupScrollIndicators();
  }

  setupCardInteractions() {
    document.querySelectorAll('.card').forEach(card => {
      // Efeito de partículas ao hover
      card.addEventListener('mouseenter', (e) => {
        this.createParticleEffect(e.currentTarget);
      });

      // Efeito de shake sutil ao clicar
      card.addEventListener('click', (e) => {
        gsap.to(e.currentTarget, {
          rotation: 1,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut"
        });
      });
    });
  }

  setupButtonRipples() {
    document.querySelectorAll('button, .btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.createRipple(e);
      });
    });
  }

  setupNavFeedback() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        this.createNavWave();
      });
    });
  }

  setupScrollIndicators() {
    // Already handled in initScrollProgress function
    
    // Add enhanced button interactions with neon lime
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, {
          boxShadow: '0 15px 50px rgba(204, 255, 0, 0.8)',
          duration: 0.3,
          ease: "power2.out"
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          boxShadow: '0 4px 20px rgba(204, 255, 0, 0.4)',
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });
  }

  createParticleEffect(element) {
    const rect = element.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('div');
      particle.className = 'micro-particle';
      particle.style.left = (rect.left + Math.random() * rect.width) + 'px';
      particle.style.top = (rect.top + Math.random() * rect.height) + 'px';
      document.body.appendChild(particle);

      gsap.to(particle, {
        y: -30,
        opacity: 0,
        scale: 0,
        duration: 1,
        ease: "power2.out",
        onComplete: () => particle.remove()
      });
    }
  }

  createRipple(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(179, 227, 215, 0.4);
      border-radius: 50%;
      pointer-events: none;
      transform: scale(0);
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    gsap.to(ripple, {
      scale: 2,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    });
  }

  createNavWave() {
    const nav = document.querySelector('nav');
    const wave = document.createElement('div');
    wave.className = 'nav-wave';
    nav.appendChild(wave);

    gsap.fromTo(wave, 
      { scaleX: 0, opacity: 0.3 },
      { scaleX: 1, opacity: 0, duration: 0.5, onComplete: () => wave.remove() }
    );
  }
}

// ===== SISTEMA DE NOTIFICAÇÕES =====
class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.container = this.createContainer();
  }

  createContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  show(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">${this.getIcon(type)}</div>
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    this.container.appendChild(notification);
    this.notifications.push(notification);

    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove
    setTimeout(() => this.hide(notification), duration);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.hide(notification);
    });

    return notification;
  }

  hide(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      this.notifications = this.notifications.filter(n => n !== notification);
    }, 300);
  }

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    return icons[type] || icons.info;
  }
}

// Instanciar sistema de notificações global
window.notifications = new NotificationSystem();

// ===== FUNCIONALIDADES ESPECÍFICAS DAS PÁGINAS =====
function initPageSpecificFeatures() {
  // Indicador de progresso de scroll
  initScrollProgress();

  // Filtros de projetos (página projetos.html)
  initProjectFilters();

  // Timeline interativa (página sobre.html)
  initInteractiveTimeline();

  // Animações da página ASA
  initASAAnimations();

  // Inicializar form de contato
  initContactForm();
}

function initScrollProgress() {
  const scrollProgress = document.getElementById('scroll-progress');
  if (!scrollProgress) return;

  let ticking = false;

  function updateProgress() {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    scrollProgress.style.width = Math.min(scrollPercent, 100) + '%';
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });

  // Initialize progress bar
  const scrollIndicator = document.createElement('div');
  scrollIndicator.className = 'scroll-indicator';
  scrollIndicator.id = 'scroll-progress';
  document.body.appendChild(scrollIndicator);
}

function initProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterButtons.length === 0 || projectCards.length === 0) return;

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');

      // Atualizar botões ativos com animação
      filterButtons.forEach(btn => {
        btn.classList.remove('active');
        gsap.to(btn, { scale: 1, duration: 0.2 });
      });
      button.classList.add('active');
      gsap.to(button, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });

      // Filtrar cards com animações aprimoradas
      const cardsToShow = [];
      const cardsToHide = [];

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        const shouldShow = filter === 'all' || category === filter;
        
        if (shouldShow) {
          cardsToShow.push(card);
        } else {
          cardsToHide.push(card);
        }
      });

      // Animar saída dos cards escondidos
      if (cardsToHide.length > 0) {
        gsap.to(cardsToHide, {
          opacity: 0,
          y: -20,
          scale: 0.9,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.in",
          onComplete: () => {
            cardsToHide.forEach(card => {
              card.style.display = 'none';
            });
          }
        });
      }

      // Animar entrada dos cards visíveis com fade-in aprimorado
      setTimeout(() => {
        cardsToShow.forEach(card => {
          card.style.display = 'block';
          gsap.fromTo(card, {
            opacity: 0,
            y: 30,
            scale: 0.8,
            rotationX: -15
          }, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 0.6,
            ease: "back.out(1.7)",
            delay: Math.random() * 0.2
          });
        });
      }, cardsToHide.length > 0 ? 200 : 0);

      // Efeito de partículas no botão clicado
      createFilterParticles(button);
    });
  });
}

// Função para criar efeito de partículas nos filtros
function createFilterParticles(button) {
  const rect = button.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      width: 4px;
      height: 4px;
      background: var(--primary-mint);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      left: ${centerX}px;
      top: ${centerY}px;
      box-shadow: 0 0 8px rgba(179, 227, 215, 0.8);
    `;
    document.body.appendChild(particle);

    const angle = (i / 8) * Math.PI * 2;
    const distance = 50 + Math.random() * 30;

    gsap.to(particle, {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity: 0,
      scale: 0,
      duration: 0.8 + Math.random() * 0.4,
      ease: "power2.out",
      onComplete: () => particle.remove()
    });
  }
}

function initInteractiveTimeline() {
  const timelineCircles = document.querySelectorAll('[data-timeline]');
  const timelineDetails = document.querySelectorAll('.timeline-detail');

  if (timelineCircles.length === 0) return;

  timelineCircles.forEach(circle => {
    circle.addEventListener('click', () => {
      const timeline = circle.getAttribute('data-timeline');
      const targetDetail = document.getElementById(`timeline-${timeline}`);

      // Esconder todos os detalhes
      timelineDetails.forEach(detail => {
        detail.classList.remove('active');
      });

      // Mostrar detalhe selecionado
      if (targetDetail) {
        targetDetail.classList.add('active');
      }

      // Animar círculo
      gsap.to(circle, {
        scale: 1.3,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      });
    });
  });
}

function initASAAnimations() {
  // Animações específicas para a página do Método ASA
  const processCircles = document.querySelectorAll('#process-flow circle[data-phase]');
  const connectionLine = document.getElementById('connection-line');

  if (processCircles.length === 0) return;

  // Animar linha de conexão na entrada da página
  if (connectionLine) {
    gsap.fromTo(connectionLine, 
      { strokeDasharray: 1000, strokeDashoffset: 1000 },
      { strokeDashoffset: 0, duration: 2, ease: "power2.out", delay: 1 }
    );
  }

  // Interatividade dos círculos
  processCircles.forEach(circle => {
    const phase = circle.getAttribute('data-phase');
    const card = document.getElementById(`${phase}-card`);

    circle.addEventListener('mouseenter', () => {
      gsap.to(circle, { scale: 1.2, duration: 0.3, ease: "back.out(1.7)" });

      if (card) {
        card.classList.add('ring-2', 'ring-[#B3E3D7]');
        gsap.to(card, { scale: 1.05, duration: 0.3, ease: "power2.out" });
      }
    });

    circle.addEventListener('mouseleave', () => {
      gsap.to(circle, { scale: 1, duration: 0.3, ease: "power2.out" });

      if (card) {
        card.classList.remove('ring-2', 'ring-[#B3E3D7]');
        gsap.to(card, { scale: 1, duration: 0.3, ease: "power2.out" });
      }
    });

    circle.addEventListener('click', () => {
      if (card) {
        card.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });

        // Pulso de destaque
        gsap.to(card, {
          scale: 1.05,
          duration: 0.2,
          yoyo: true,
          repeat: 3,
          ease: "power2.out"
        });
      }
    });
  });
}

function initContactForm() {
  const form = document.querySelector('form[aria-label="Formulário de contato AEther"]');
  if (!form) return;

  const submitBtn = document.getElementById('submit-btn');
  const requiredFields = form.querySelectorAll('[required]');

  function validateForm() {
    let isValid = true;
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('border-red-500');
        field.classList.remove('border-green-500');
      } else {
        field.classList.remove('border-red-500');
        field.classList.add('border-green-500');
      }
    });

    if (submitBtn) {
      submitBtn.disabled = !isValid;
      submitBtn.classList.toggle('opacity-50', !isValid);
    }
    return isValid;
  }

  requiredFields.forEach(field => {
    field.addEventListener('input', validateForm);
    field.addEventListener('blur', validateForm);
    field.addEventListener('focus', () => {
      field.classList.add('ring-2', 'ring-blue-400');
    });
    field.addEventListener('blur', () => {
      field.classList.remove('ring-2', 'ring-blue-400');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateForm()) {
      submitBtn.textContent = 'Enviando...';
      submitBtn.disabled = true;
      submitBtn.classList.add('animate-pulse');

      try {
        // Simular envio do formulário
        await new Promise(resolve => setTimeout(resolve, 1500));

        submitBtn.textContent = 'Mensagem Enviada!';
        submitBtn.classList.remove('animate-pulse');
        submitBtn.classList.add('bg-green-500');

        // Efeito de confete
        createConfetti();

        // Notificação de sucesso
        window.notifications.show(
          'Sua mensagem foi enviada com sucesso! Entraremos em contato em breve.',
          'success',
          5000
        );

        form.reset();

        setTimeout(() => {
          submitBtn.textContent = 'Enviar Mensagem';
          submitBtn.classList.remove('bg-green-500');
          submitBtn.disabled = false;
          validateForm();
        }, 3000);
      } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        submitBtn.textContent = 'Erro ao Enviar';
        submitBtn.classList.remove('animate-pulse');
        submitBtn.classList.add('bg-red-500');

        // Notificação de erro
        window.notifications.show(
          'Erro ao enviar mensagem. Tente novamente.',
          'error',
          4000
        );

        setTimeout(() => {
          submitBtn.textContent = 'Enviar Mensagem';
          submitBtn.classList.remove('bg-red-500');
          submitBtn.disabled = false;
        }, 2000);
      }
    }
  });

  // Método para criar confete
  function createConfetti() {
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${Math.random() > 0.5 ? '#B3E3D7' : '#F5C0B5'};
        top: 50%;
        left: 50%;
        z-index: 10000;
        border-radius: 50%;
        pointer-events: none;
      `;
      document.body.appendChild(confetti);

      gsap.to(confetti, {
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        rotation: Math.random() * 360,
        scale: 0,
        duration: 2,
        ease: "power2.out",
        onComplete: () => confetti.remove()
      });
    }
  }

  validateForm();
}

// Inicializar textura de fundo e transições
document.addEventListener('DOMContentLoaded', () => {
  const loadingManager = new LoadingManager();
  new ParticleSystem();
  new PageTransitions();
  new MicroInteractions();

  // Esconder loading após inicialização
  setTimeout(() => loadingManager.hide(), 1000);

  // Inicializar funcionalidades específicas das páginas
  initPageSpecificFeatures();

  // Efeitos de hover 3D para cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      gsap.to(card, {
        duration: 0.3,
        rotationY: 5,
        rotationX: 5,
        z: 20,
        ease: "power2.out"
      });
    });

    card.addEventListener('mouseleave', (e) => {
      gsap.to(card, {
        duration: 0.3,
        rotationY: 0,
        rotationX: 0,
        z: 0,
        ease: "power2.out"
      });
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      gsap.to(card, {
        duration: 0.1,
        rotationX: rotateX,
        rotationY: rotateY,
        transformPerspective: 1000,
        ease: "power1.out"
      });
    });
  });

  // ===== ANIMAÇÕES ESPECÍFICAS DAS PÁGINAS =====

  // Linha do tempo animação (Sobre) - declaração única
  const timelineSvgElement = document.querySelector("#linha-do-tempo-svg");
  if (timelineSvgElement) {
    gsap.from("#linha-do-tempo-svg circle", {
      scale: 0,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: "#linha-do-tempo-svg",
        start: "top 80%",
      }
    });

    gsap.from("#linha-do-tempo-svg text", {
      y: 20,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#linha-do-tempo-svg",
        start: "top 80%",
      }
    });
  }

  // ASA fluxograma com efeitos 3D - declaração única
  const asaFluxElement = document.querySelector("#asa-fluxograma");
  if (asaFluxElement) {
    gsap.from("#asa-fluxograma div", {
      opacity: 0,
      scale: 0.8,
      rotationY: 90,
      z: -50,
      duration: 1.2,
      stagger: 0.3,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: "#asa-fluxograma",
        start: "top 85%",
      }
    });
  }

  // Animações de entrada para elementos
  gsap.from("h1, h2, h3", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power2.out"
  });

  gsap.from("p, li", {
    y: 20,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    delay: 0.3,
    ease: "power2.out"
  });
});