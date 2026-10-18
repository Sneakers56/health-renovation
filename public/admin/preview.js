/* Styled previews for Decap CMS: mirror the markup of the real Astro pages. */
(function () {
  const { CMS, h, createClass, HR } = window;

  CMS.registerPreviewStyle('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
  CMS.registerPreviewStyle('/admin/preview.css');
  CMS.registerPreviewStyle(
    `.cms-hidden { position: relative; opacity: .35; }
     .cms-hidden::before { content: 'Hidden on site'; position: absolute; top: 8px; left: 8px; z-index: 5;
       background: #b00020; color: #fff; font: 600 12px/1 Inter, sans-serif; padding: 6px 10px; border-radius: 999px; }
     .cms-note { margin: 1rem auto; max-width: 640px; padding: 1.25rem; border: 2px dashed #cde0ec; border-radius: 12px;
       color: #5a7282; text-align: center; font-size: .9rem; background: #fff; }
     .hero-image img, .about-photo, .service-feature-image { display: block; }`,
    { raw: true }
  );

  const list = (arr) => (Array.isArray(arr) ? arr : []);
  const site = HR.site;
  const tel = site.phone.replace(/\s/g, '');

  function icon(name, size) {
    const d = HR.icons[name];
    if (!d) return null;
    return h('svg', { width: size || 24, height: size || 24, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' }, h('path', { d }));
  }

  // ── Service page preview ─────────────────────────────────────
  const ServicePreview = createClass({
    render() {
      const { entry, widgetFor, getAsset } = this.props;
      const d = entry.get('data').toJS();
      const slug = entry.get('slug') || '';
      const img = d.image ? getAsset(d.image) : null;
      return h('div', {},
        h('nav', { className: 'breadcrumb-nav' },
          h('div', { className: 'container' },
            h('ol', { className: 'breadcrumb-list' },
              h('li', {}, h('a', {}, 'Home')), h('li', {}, h('a', {}, 'Services')), h('li', { 'aria-current': 'page' }, d.title)))),
        h('section', { className: 'service-hero service-hero--' + slug },
          h('div', { className: 'container' },
            h('div', { className: 'service-hero-content' },
              h('h1', { className: 'service-hero-title' }, (d.title || '') + ' in ' + site.suburb),
              h('p', { className: 'service-hero-subtitle' }, d.tagline)))),
        h('div', { className: 'container service-container section-pad' },
          h('div', { className: 'service-grid' },
            h('div', { className: 'service-main-content' },
              widgetFor('body'),
              h('h2', {}, 'Key Benefits'),
              h('ul', {}, list(d.benefits).map((b, i) => h('li', { key: i }, b))),
              h('p', {}, h('strong', {}, 'Session length: '), d.duration, '. Available in-clinic in ' + site.suburb + ' or as a mobile in-home session.')),
            h('aside', { className: 'service-sidebar' },
              img && h('div', { className: 'service-featured-card' }, h('img', { src: img.toString(), alt: '', className: 'service-feature-image' })),
              h('div', { className: 'service-info-card' },
                h('h2', { className: 'info-card-title' }, 'Ready to begin?'),
                h('p', { className: 'info-card-text' }, 'Book a free discovery call to find out how ' + (d.title || '').toLowerCase() + ' can support you.'),
                h('div', { className: 'cta-actions sidebar-cta' },
                  h('a', { className: 'btn btn-primary btn-lg' }, icon('phone', 18), ' Call Now'),
                  h('a', { className: 'btn btn-outline btn-lg' }, 'Text Me')))))),
        h('div', { className: 'container', style: { paddingBottom: '2rem' } },
          h('h2', { className: 'section-title', style: { fontSize: '1.25rem' } }, 'How it appears in the services grid'),
          h('div', { className: 'services-grid', style: { gridTemplateColumns: 'minmax(0, 360px)' } },
            h('article', { className: 'service-card service-card--' + d.color },
              h('div', { className: 'service-card-icon' }, icon(d.icon, 40)),
              h('div', { className: 'service-card-body' },
                h('h3', { className: 'service-card-title' }, d.title),
                h('p', { className: 'service-card-excerpt' }, d.excerpt),
                h('span', { className: 'service-duration' }, icon('clock', 14), ' ', d.duration)),
              h('a', { className: 'service-card-link btn btn-ghost' }, 'Learn more ', icon('chevron', 16))))));
    },
  });

  // ── Blog article preview ─────────────────────────────────────
  const PostPreview = createClass({
    render() {
      const { entry, widgetFor, getAsset } = this.props;
      const d = entry.get('data').toJS();
      const date = d.date ? new Date(d.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      return h('article', { className: 'post-article section-pad' },
        h('div', { className: 'container narrow-container' },
          d.draft && h('p', { className: 'cms-note' }, 'Draft – not published until you untick "Draft".'),
          h('header', { className: 'post-header' },
            h('p', { className: 'post-card-meta' }, date + ' · ' + site.practitioner),
            h('h1', { className: 'section-title' }, d.title),
            h('p', { className: 'section-lead' }, d.description)),
          d.image && h('img', { src: getAsset(d.image).toString(), alt: '', className: 'post-hero-image' }),
          h('div', { className: 'rich-text post-content' }, widgetFor('body'))));
    },
  });

  CMS.registerPreviewTemplate('services', ServicePreview);
  CMS.registerPreviewTemplate('posts', PostPreview);
})();
