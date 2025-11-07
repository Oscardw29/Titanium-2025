// main.js: behavior for the landing page
// Primary action button navigates to the Agenda (agenda.html)
document.addEventListener('DOMContentLoaded', () => {
  // ===== BOTÓN EMPEZAR =====
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    // Add ripple effect on click
    startBtn.addEventListener('click', (e) => {
      // Create ripple element
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      
      // Calculate ripple position
      const rect = startBtn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      startBtn.appendChild(ripple);
      
      // Navigate after animation starts
      setTimeout(() => {
        window.location.href = 'agenda.html';
      }, 300);
      
      // Remove ripple after animation
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
    
    // Add floating animation on mouse enter
    startBtn.addEventListener('mouseenter', () => {
      startBtn.style.animation = 'float 1.5s ease-in-out infinite';
    });
    
    startBtn.addEventListener('mouseleave', () => {
      startBtn.style.animation = 'pulse-glow 2s ease-in-out infinite';
    });
  }

  // ===== CARRUSEL AUTOMÁTICO =====
  const slides = document.querySelectorAll('.carousel-slide');
  let currentIndex = 0;
  
  // Función para actualizar las posiciones de las slides
  function updateCarousel() {
    slides.forEach((slide, index) => {
      // Remover todas las clases
      slide.classList.remove('center', 'left', 'right');
      
      // Calcular posición relativa al índice actual
      let position = index - currentIndex;
      
      // Ajustar para carrusel circular
      if (position < 0) position += slides.length;
      if (position >= slides.length) position -= slides.length;
      
      // Asignar clase según posición
      if (position === 0) {
        slide.classList.add('center');
      } else if (position === slides.length - 1) {
        slide.classList.add('left');
      } else if (position === 1) {
        slide.classList.add('right');
      }
    });
  }
  
  // Función para avanzar al siguiente slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
  }
  
  // Inicializar carrusel
  if (slides.length > 0) {
    updateCarousel();
    
    // Rotación automática cada 4 segundos
    setInterval(nextSlide, 4000);
  }
});


