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
     SCROLL REVEALS — fade-up, gold lines, image reveals (play once)
     ---------------------------------------------------------------------- */
  // Fade-up
  gsap.utils.toArray('.reveal').forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  // Gold accent lines
  gsap.utils.toArray('.gold-line').forEach(function (el) {
    gsap.to(el, {
      scaleX: 1, duration: 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  // Image reveals (clip-path wipe)
  gsap.utils.toArray('.img-reveal').forEach(function (el) {
    gsap.to(el, {
      clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power3.inOut',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
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
