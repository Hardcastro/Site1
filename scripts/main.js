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
  }

  createParticles() {
    const isMobile = window.innerWidth < 768;
    const particleCount = Math.floor((this.canvas.width * this.canvas.height) / (isMobile ? 15000 : 10000));
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

// Inicializar textura de fundo e transições
document.addEventListener('DOMContentLoaded', () => {
  new InteractiveBackground();
  new PageTransitions();

  // Validação de formulário aprimorada
  const form = document.querySelector('form[aria-label="Formulário de contato AEther"]');
  if (form) {
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

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm()) {
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;
        submitBtn.classList.add('animate-pulse');

        setTimeout(() => {
          submitBtn.textContent = 'Mensagem Enviada!';
          submitBtn.classList.remove('animate-pulse');
          submitBtn.classList.add('bg-green-500');
          form.reset();

          setTimeout(() => {
            submitBtn.textContent = 'Enviar Mensagem';
            submitBtn.classList.remove('bg-green-500');
            submitBtn.disabled = false;
            validateForm();
          }, 3000);
        }, 1500);
      }
    });

    validateForm();
  }

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
});

// ===== ANIMAÇÕES ESPECÍFICAS DAS PÁGINAS =====

// Linha do tempo animação (Sobre)
const timelineSvg = document.querySelector("#linha-do-tempo-svg");
if (timelineSvg) {
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

// ASA fluxograma com efeitos 3D
const asaFlux = document.querySelector("#asa-fluxograma");
if (asaFlux) {
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