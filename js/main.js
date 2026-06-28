/* ==========================================================================
   TEMPL CONSTRUCTIONS — main.js
   GSAP-driven animation, loading screen, page transitions, reveals.
   Every motion is deliberate and slow. Premium means patient.
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', function () {

  /* ----------------------------------------------------------------------
     PAGE TRANSITION — fade the overlay out on arrival
     ---------------------------------------------------------------------- */
  const transition = document.getElementById('page-transition');
  if (transition) {
    gsap.set(transition, { opacity: 1 });
    gsap.to(transition, { opacity: 0, duration: 0.6, ease: 'power2.out',
      onComplete: () => { transition.style.pointerEvents = 'none'; } });
  }

  // Intercept internal navigation: fade overlay in, then navigate.
  function isInternalLink(a) {
    if (!a) return false;
    const href = a.getAttribute('href');
    if (!href) return false;
    if (a.target === '_blank') return false;
    if (href.startsWith('http') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('#')) return false;
    return href.endsWith('.html') || href === '/' || href === 'index.html';
  }

  document.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!isInternalLink(a)) return;
      const dest = a.getAttribute('href');
      if (dest === window.location.pathname.split('/').pop()) return; // same page
      e.preventDefault();
      if (!transition) { window.location.href = dest; return; }
      transition.style.pointerEvents = 'auto';
      gsap.to(transition, {
        opacity: 1, duration: 0.35, ease: 'power2.inOut',
        onComplete: () => { window.location.href = dest; }
      });
    });
  });

  /* ----------------------------------------------------------------------
     LOADING SCREEN (homepage only)
     ---------------------------------------------------------------------- */
  const loader = document.getElementById('loader');
  if (loader) {
    const loaderLogo = loader.querySelector('.loader-logo');
    const loaderBar = loader.querySelector('.loader-bar span');
    const video = document.getElementById('heroVideo');

    // Very slow, barely-perceptible logo zoom
    gsap.to(loaderLogo, { scale: 1, opacity: 1, duration: 2.5, ease: 'power1.out' });
    // Linear gold bar fill
    gsap.to(loaderBar, { scaleX: 1, duration: 2.8, ease: 'none' });

    let exited = false;
    function exitLoader() {
      if (exited) return;
      exited = true;
      gsap.to(loader, {
        opacity: 0, duration: 0.8, ease: 'power2.out',
        onComplete: function () {
          loader.style.display = 'none';
          if (video) { const p = video.play(); if (p) p.catch(function (err) { console.warn('Hero video autoplay was blocked by the browser:', err); }); }
          // Logo + CTA reveal after the curtain lifts
          revealHomeChrome();
        }
      });
    }

    // Exit when the video can play through, or after a 3s fallback —
    // but never before the loading animation has had a beat to breathe.
    if (video) {
      if (video.readyState >= 4) {
        setTimeout(exitLoader, 2600);
      } else {
        video.addEventListener('canplaythrough', () => setTimeout(exitLoader, 2600), { once: true });
      }
    }
    setTimeout(exitLoader, 3000);   // hard fallback
  } else {
    revealHomeChrome();             // no loader on inner pages (no-op there)
  }

  function revealHomeChrome() {
    const homeLogo = document.getElementById('homeLogo');
    const homeToggle = document.querySelector('.home-toggle');
    const ctaUnderline = document.querySelector('.home-cta .cta-underline');
    if (homeLogo) {
      gsap.to(homeLogo, { opacity: 1, duration: 1, delay: 1, ease: 'power2.out' });
    }
    if (homeToggle) {
      gsap.to(homeToggle, { opacity: 1, duration: 1, delay: 1.2, ease: 'power2.out' });
    }
    if (ctaUnderline) {
      gsap.to(ctaUnderline, { scaleX: 1, duration: 1.4, delay: 1, ease: 'power3.out' });
    }
  }

  /* ----------------------------------------------------------------------
     MOBILE NAVIGATION
     ---------------------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileClose = document.getElementById('mobileClose');
  if (navToggle && mobileNav) {
    const openNav = () => gsap.to(mobileNav, { x: '0%', duration: 0.5, ease: 'power3.out' });
    const closeNav = () => gsap.to(mobileNav, { x: '100%', duration: 0.5, ease: 'power3.in' });
    navToggle.addEventListener('click', openNav);
    if (mobileClose) mobileClose.addEventListener('click', closeNav);
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  }

  /* ----------------------------------------------------------------------
     SCROLL REVEALS — IntersectionObserver only (no external library)
     Fade-up on .reveal, scaleX on .gold-line, fade-in on .img-reveal. The
     CSS holds the start/end states; we just toggle .is-visible. Elements
     trigger early (top crosses ~90% of the viewport) so a 0.5s reveal is
     finished and readable well before the user scrolls past. Children of a
     [data-stagger] block animate in 100ms steps. Honours reduced-motion.
     ---------------------------------------------------------------------- */
  (function initReveals() {
    const revealEls = document.querySelectorAll('.reveal, .gold-line, .img-reveal');
    if (!revealEls.length) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Stagger: each animated child of a [data-stagger] block gets a delay.
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      group.querySelectorAll('.reveal, .img-reveal').forEach(function (item, i) {
        item.style.transitionDelay = (i * 0.1) + 's';
      });
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      // Show everything immediately; no motion.
      revealEls.forEach(function (el) {
        el.style.transitionDelay = '0s';
        el.classList.add('is-visible');
      });
      return;
    }

    const io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  })();

  /* ----------------------------------------------------------------------
     GALLERY LIGHTBOX — fullscreen viewer, prev/next, keyboard + touch swipe.
     Navigation is scoped to each .project group (never jumps between projects).
     ---------------------------------------------------------------------- */
  (function initLightbox() {
    const projects = document.querySelectorAll('.project');
    if (!projects.length) return;

    const groups = [];
    projects.forEach(function (project) {
      const imgs = Array.from(project.querySelectorAll('.gallery-item img'));
      if (!imgs.length) return;
      const groupIndex = groups.length;
      groups.push(imgs.map(function (img) {
        return { src: img.currentSrc || img.src, alt: img.alt || '' };
      }));
      imgs.forEach(function (img, i) {
        img.addEventListener('click', function () { open(groupIndex, i); });
      });
    });
    if (!groups.length) return;

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close">&times;</button>' +
      '<button class="lb-prev" aria-label="Previous image">&#8249;</button>' +
      '<img alt="">' +
      '<button class="lb-next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(lb);

    const lbImg = lb.querySelector('img');
    let g = 0, i = 0;

    function render() {
      const item = groups[g][i];
      lbImg.src = item.src;
      lbImg.alt = item.alt;
    }
    function open(gi, ii) {
      g = gi; i = ii;
      render();
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    }
    function prev() { i = (i - 1 + groups[g].length) % groups[g].length; render(); }
    function next() { i = (i + 1) % groups[g].length; render(); }

    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', prev);
    lb.querySelector('.lb-next').addEventListener('click', next);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    });

    // Touch swipe (mobile)
    let startX = 0, startY = 0, tracking = false;
    lb.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) prev(); else next();
      }
    }, { passive: true });
  })();

  /* ----------------------------------------------------------------------
     DYNAMIC COPYRIGHT YEAR — never goes stale
     ---------------------------------------------------------------------- */
  document.querySelectorAll('.footer-year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ----------------------------------------------------------------------
     CONTACT FORM — AJAX submit to Netlify, then thank-you message
     ---------------------------------------------------------------------- */
  const form = document.getElementById('contactForm');
  const thanks = document.getElementById('formThanks');
  if (form && thanks) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = new URLSearchParams(new FormData(form)).toString();

      function showThanks() {
        form.style.display = 'none';
        thanks.style.display = 'block';
        gsap.fromTo(thanks, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' });
      }

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data
      }).then(function (response) {
        if (response.ok) {
          // Only confirm once Netlify has actually accepted the enquiry.
          showThanks();
        } else {
          // Do NOT fake success: a customer enquiry must never be silently
          // dropped. Fall back to a real native submit so the full POST is
          // delivered and processed by Netlify.
          console.error('Enquiry POST returned HTTP ' + response.status + '; falling back to native submit.');
          form.submit();
        }
      }).catch(function (err) {
        // Network failure — never show a false "thank you"; submit for real.
        console.error('Enquiry POST failed; falling back to native submit.', err);
        form.submit();
      });
    });
  }
});
