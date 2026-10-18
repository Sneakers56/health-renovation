import type { ReactNode } from 'react';
import { blocks, meta, Img, telOf } from './blocks';
import { EditorStyles } from './frame';
import { Icon } from './Icon';
import { text, textarea, radio, select, imageField, iconField } from './fields';

const yesNo = [{ label: 'No', value: false }, { label: 'Yes', value: true }];
const seoFields = {
  seoTitle: text('Title in Google (blank = page title)'),
  seoDescription: textarea('Description in Google (about 150 characters)'),
  noindex: radio('Hide from search engines', yesNo),
};

/** Adds a 'Hide on site' switch to every block. Hidden blocks are dimmed in the editor and skipped on the site. */
function withHideToggle<T extends Record<string, any>>(components: T): T {
  const out: Record<string, any> = {};
  for (const [name, c] of Object.entries(components)) {
    out[name] = {
      ...c,
      fields: { ...c.fields, hidden: radio('Hide on site', yesNo) },
      defaultProps: { ...c.defaultProps, hidden: false },
      render: (props: any) => {
        if (!props.hidden) return c.render(props);
        if (!props.puck?.isEditing) return <></>;
        return <div className="cms-hidden">{c.render(props)}</div>;
      },
    };
  }
  return out as T;
}

const components = withHideToggle(blocks);
const categories = {
  layout: { title: 'Layout', components: ['Section', 'Columns', 'Spacer', 'Divider'] },
  basics: { title: 'Basics', components: ['Heading', 'RichText', 'Image', 'Button', 'Video', 'IconCard', 'Quote'] },
  sections: {
    title: 'Ready-made sections',
    components: ['Hero', 'Banner', 'TrustBar', 'TextSection', 'ImageText', 'Cards', 'ServicesGrid', 'Tags', 'Faq', 'Cta', 'Contact', 'Booking', 'Gallery', 'Testimonials', 'LatestPosts'],
  },
};
const bodyCategories = {
  basics: { title: 'Basics', components: ['Heading', 'RichText', 'Image', 'Button', 'Video', 'IconCard', 'Quote', 'Spacer', 'Divider', 'Columns'] },
  sections: { title: 'Ready-made sections', components: ['Faq', 'Gallery', 'Testimonials', 'Cards', 'Booking'] },
  other: { visible: false },
};

/* ── Pages ───────────────────────────────────────────────────────────────── */

export const pageConfig = {
  categories,
  root: {
    fields: { title: text('Page title'), ...seoFields },
    defaultProps: { title: 'New page', seoTitle: '', seoDescription: '', noindex: false },
    render: ({ children, puck }: { children: ReactNode; puck: any }) =>
      puck?.isEditing ? (
        <>
          <EditorStyles />
          <main className="site-main hr-editing">{children}</main>
        </>
      ) : (
        <>{children}</>
      ),
  },
  components,
};

/* ── Services ────────────────────────────────────────────────────────────── */

function ServiceTemplate(p: any) {
  const { children, puck } = p;
  const m = meta(puck);
  const site = m.site ?? ({} as any);
  const tel = telOf(site.phone);
  const list = m.services ?? [];
  const i = list.findIndex((s) => s.slug === m.current);
  const prev = i > 0 ? list[i - 1] : null;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  const benefits: { text: string }[] = p.benefits ?? [];

  return (
    <>
      {puck?.isEditing && <EditorStyles />}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <div className="container">
          <ol className="breadcrumb-list">
            <li><a href="/">Home</a></li>
            <li><a href="/services/">Services</a></li>
            <li aria-current="page">{p.title}</li>
          </ol>
        </div>
      </nav>
      <article>
        <section className={`service-hero service-hero--${m.current ?? ''}`}>
          <div className="container">
            <div className="service-hero-content">
              <h1 className="service-hero-title">{p.title} in {site.suburb}</h1>
              {p.tagline && <p className="service-hero-subtitle">{p.tagline}</p>}
            </div>
          </div>
        </section>
        <div className="container service-container section-pad">
          <div className="service-grid">
            <div className="service-main-content">
              {children}
              {benefits.length > 0 && (
                <>
                  <h2>Key Benefits</h2>
                  <ul>{benefits.map((b, n) => <li key={n}>{b.text}</li>)}</ul>
                </>
              )}
              {p.duration && (
                <p><strong>Session length:</strong> {p.duration}. Available in-clinic in {site.suburb} or as a mobile in-home session.</p>
              )}
            </div>
            <aside className="service-sidebar">
              {p.image && (
                <div className="service-featured-card">
                  <Img name={p.image} alt={p.imageAlt || `${p.title} session`} className="service-feature-image" sizes="(max-width: 960px) 100vw, 400px" priority puck={puck} />
                </div>
              )}
              <div className="service-info-card">
                <h2 className="info-card-title">Ready to begin?</h2>
                <p className="info-card-text">Book a free discovery call to find out how {String(p.title || '').toLowerCase()} can support you.</p>
                <div className="cta-actions sidebar-cta">
                  <a className="btn btn-primary btn-lg" href={`tel:${tel}`}><Icon name="phone" size={18} /> Call Now</a>
                  <a className="btn btn-outline btn-lg" href={`sms:${tel}`}>Text Me</a>
                </div>
              </div>
            </aside>
          </div>
        </div>
        {(prev || next) && (
          <nav className="post-navigation" aria-label="More services">
            <div className="container nav-links">
              {prev ? <a className="nav-previous" href={`/services/${prev.slug}/`}>← {prev.title}</a> : <span />}
              {next ? <a className="nav-next" href={`/services/${next.slug}/`}>{next.title} →</a> : <span />}
            </div>
          </nav>
        )}
      </article>
    </>
  );
}

export const serviceConfig = {
  categories: bodyCategories,
  root: {
    fields: {
      title: text('Service name'),
      tagline: text('Tagline (under the heading)'),
      excerpt: textarea('Card summary (services grid on the homepage)'),
      duration: text('Session length (e.g. 1 hour)'),
      image: imageField('Photo'),
      imageAlt: text('Photo description (for accessibility)'),
      benefits: { type: 'array' as const, label: 'Key benefits', arrayFields: { text: text('Benefit') }, getItemSummary: (b: any) => b.text || 'Benefit' },
      order: { type: 'number' as const, label: 'Order in lists (1 = first)', min: 1 },
      color: select('Card colour', ['green', 'teal', 'amber', 'blue', 'purple', 'rose']),
      icon: iconField('Card icon'),
      ...seoFields,
    },
    defaultProps: { title: 'New service', tagline: '', excerpt: '', duration: '', image: '', imageAlt: '', benefits: [], order: 99, color: 'green', icon: 'check', seoTitle: '', seoDescription: '', noindex: false },
    render: ServiceTemplate,
  },
  components,
};

/* ── Blog articles ───────────────────────────────────────────────────────── */

function PostTemplate(p: any) {
  const { children, puck } = p;
  const m = meta(puck);
  const site = m.site ?? ({} as any);
  const tel = telOf(site.phone);
  const date = p.date ? new Date(p.date) : null;
  return (
    <>
      {puck?.isEditing && <EditorStyles />}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <div className="container">
          <ol className="breadcrumb-list">
            <li><a href="/">Home</a></li>
            <li><a href="/blog/">Articles</a></li>
            <li aria-current="page">{p.title}</li>
          </ol>
        </div>
      </nav>
      <article className="post-article section-pad">
        <div className="container narrow-container">
          {puck?.isEditing && p.draft && <p className="hr-placeholder">Draft – not published until you set “Draft” to No.</p>}
          <header className="post-header">
            <p className="post-card-meta">
              {date && !isNaN(date.valueOf()) && <time dateTime={date.toISOString()}>{date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</time>}
              {' · '}{site.practitioner}
            </p>
            <h1 className="section-title">{p.title}</h1>
            {p.description && <p className="section-lead">{p.description}</p>}
          </header>
          {p.image && <Img name={p.image} alt={p.imageAlt} className="post-hero-image" sizes="(max-width: 760px) 100vw, 700px" priority puck={puck} />}
          <div className="post-content">{children}</div>
          <aside className="service-info-card post-cta">
            <h2 className="info-card-title">Want to talk it through?</h2>
            <p className="info-card-text">Book a free discovery call with {site.practitioner}.</p>
            <div className="cta-actions">
              <a className="btn btn-primary" href={`tel:${tel}`}>Call {site.phone}</a>
              <a className="btn btn-ghost" href="/contact/">Send a Message</a>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}

export const postConfig = {
  categories: bodyCategories,
  root: {
    fields: {
      title: text('Article title'),
      description: textarea('Summary (blog page and Google)'),
      date: text('Publish date (YYYY-MM-DD)'),
      image: imageField('Main photo'),
      imageAlt: text('Photo description (for accessibility)'),
      draft: radio('Draft (not published)', [{ label: 'Yes – draft', value: true }, { label: 'No – publish', value: false }]),
    },
    defaultProps: { title: 'New article', description: '', date: '', image: '', imageAlt: '', draft: true },
    render: PostTemplate,
  },
  components,
};

export const configs = { page: pageConfig, service: serviceConfig, post: postConfig };
export type DocKind = keyof typeof configs;
