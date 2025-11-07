// Lightweight toast notifications shared across pages
(function(){
  function ensureContainer(){
    let c = document.getElementById('notificationContainer');
    if(!c){
      c = document.createElement('div');
      c.id = 'notificationContainer';
      c.className = 'notification-container';
      c.setAttribute('aria-live','polite');
      c.setAttribute('aria-atomic','true');
      document.body.appendChild(c);
    }
    return c;
  }

  function closeToast(node){
    if(!node) return;
    clearTimeout(node._hideTimeout);
    node.style.opacity = '0';
    node.style.transform = 'translateY(6px)';
    setTimeout(()=>{ if(node.parentNode) node.parentNode.removeChild(node); }, 220);
  }

  window.showNotification = function(title, message, options){
    options = options || {};
    const container = ensureContainer();

    const toast = document.createElement('div');
    toast.className = 'toast';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label','Cerrar notificación');
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => closeToast(toast);

    const t = document.createElement('div');
    t.className = 'toast-title';
    t.textContent = title || 'Info';

    const m = document.createElement('div');
    m.className = 'toast-message';
    m.textContent = message || '';

    toast.appendChild(closeBtn);
    toast.appendChild(t);
    toast.appendChild(m);
    container.appendChild(toast);

    const ttl = options.duration || 3000;
    const hideTimeout = setTimeout(() => closeToast(toast), ttl);
    toast._hideTimeout = hideTimeout;

    return toast;
  };
})();
