// Mobile drawer navigation handler
(function(){
  'use strict';
  
  function initDrawer(){
    console.log('Initializing drawer...');
    
    const header = document.querySelector('.header');
    const nav = document.querySelector('.main-nav');
    
    if(!header || !nav) {
      console.log('Header or nav not found');
      return;
    }

    // Check if hamburger already exists
    if(document.querySelector('.hamburger-btn')) {
      console.log('Hamburger already exists');
      return;
    }

    console.log('Creating hamburger...');

    // Create hamburger button
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-btn';
    hamburger.setAttribute('aria-label', 'Abrir menú de navegación');
    hamburger.setAttribute('type', 'button');
    hamburger.innerHTML = '<span></span><span></span><span></span>';

    // Insert elements
    header.insertBefore(hamburger, header.firstChild);

    console.log('Hamburger created');

    // Functions
    function openDrawer(){
      console.log('Opening drawer');
      nav.classList.add('active');
      hamburger.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer(){
      console.log('Closing drawer');
      nav.classList.remove('active');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    }

    function toggleDrawer(e){
      e.preventDefault();
      e.stopPropagation();
      console.log('Toggle drawer clicked');
      
      if(nav.classList.contains('active')){
        closeDrawer();
      } else {
        openDrawer();
      }
    }

    // Event listeners
    console.log('Adding event listeners...');
    
    hamburger.addEventListener('click', toggleDrawer);
    hamburger.addEventListener('touchend', function(e){
      e.preventDefault();
      toggleDrawer(e);
    });

    // Close on nav link click
    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function(){
        setTimeout(closeDrawer, 150);
      });
    });

    // Close on ESC
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && nav.classList.contains('active')){
        closeDrawer();
      }
    });

    // Close on resize
    window.addEventListener('resize', function(){
      if(window.innerWidth > 480 && nav.classList.contains('active')){
        closeDrawer();
      }
    });

    console.log('Drawer initialized successfully');
  }

  // Wait for DOM
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initDrawer);
  } else {
    initDrawer();
  }
})();
