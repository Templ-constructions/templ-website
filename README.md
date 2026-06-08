# Templ Constructions — Website

A premium static marketing site for Templ Constructions (Melbourne residential
builder). Pure HTML5 / CSS3 / vanilla JS with GSAP for animation. No build step.
Deployed on Netlify; the contact form uses Netlify Forms.

## Structure

```
index.html        Locked cinematic homepage (loading screen + hero video + CTA only)
about.html        Story, The Design Files feature, SCODA values, ideal client
gallery.html      Four projects — Collingwood, Mount Eliza, Rhyll, Richmond
contact.html      Qualifying enquiry form (Netlify Forms)
reviews.html      Seven 5-star reviews
css/style.css     Brand system + responsive
js/main.js        Loading screen, page transitions, scroll reveals, form handler
netlify.toml      Static deploy config + asset caching headers
assets/           logo (SVG), images (resized JPEGs), videos (see below)
```

## Local preview

```bash
cd templ-website
python3 -m http.server 8765
# open http://localhost:8765
```

## Before going live (owner to-do)

1. **Videos** — compress the three source clips in HandBrake and drop them in
   `assets/videos/` (exact filenames + settings in `assets/videos/README.txt`).
   Until then the video areas show black; nothing breaks.
2. **Your photo** — add `assets/images/james.jpg` (About page; auto-hides if absent).
3. **Form notifications** — after first Netlify deploy, set the `contact-enquiry`
   form to email `james@templconstructions.com.au`.

## Coding standard — The Seven Critical Path Rules

This project is built and maintained under the global
**[Seven Critical Path Rules](../knowledge-base/SOPs/ai-era-critical-path-coding-standard.md)**
standard (HAL nickname: *The 7 Laws of HAL*), which applies to every project by
default unless explicitly exempted.

The per-rule audit for this site — classification, findings fixed, what was
verified, and what could not be verified on this machine — lives in
**[`CRITICAL-PATH.md`](CRITICAL-PATH.md)**. Read it before changing the contact
form, which is the site's one critical-path surface (it carries customer enquiry
data). Re-run the manual rule walk-through and update that file on any change to
critical-path behavior.
