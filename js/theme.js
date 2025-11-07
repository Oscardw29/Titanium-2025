// Toggle de tema minimalista: botón simple con ícono en el header (sin SVG complejo)
(function(){
  const STORAGE_KEY = 'theme'; // 'dark' | 'light'

  function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
  }

  function currentTheme(){
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  function setButtonVisual(btn, theme){
    // Mostrar el icono del estado actual y texto corto accesible.
    // Indicamos la acción futura en title.
    if(theme === 'dark'){
      btn.innerHTML = '☀️';
      btn.setAttribute('title','Cambiar a modo claro');
      btn.setAttribute('aria-label','Cambiar a modo claro');
    } else {
      btn.innerHTML = '🌙';
      btn.setAttribute('title','Cambiar a modo oscuro');
      btn.setAttribute('aria-label','Cambiar a modo oscuro');
    }
  }

  function ensureButton(theme){
    const existing = document.getElementById('themeToggleBtn');
    if(existing){
      setButtonVisual(existing, theme);
      return existing;
    }
    const header = document.querySelector('.header');
    if(!header) return null;
    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.type = 'button';
    btn.className = 'theme-toggle-btn';
    setButtonVisual(btn, theme);
    header.appendChild(btn); // se ubica al final del flex (derecha)
    return btn;
  }

  function init(){
    const theme = currentTheme();
    applyTheme(theme);
    const btn = ensureButton(theme);
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      setButtonVisual(btn, next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
