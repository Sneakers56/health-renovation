import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { imageField, buttonField, iconField, text, textarea, rich, select, radio } from './fields';
import type { Button, SiteMeta } from './types';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

export const meta = (puck: any) => (puck?.metadata ?? {}) as SiteMeta;
export const telOf = (phone = '') => phone.replace(/\s/g, '');
const yesNo = [{ label: 'Yes', value: true }, { label: 'No', value: false }];

export function Img(props: { name?: string; alt?: string; className?: string; sizes?: string; priority?: boolean; puck: any }) {
  const { name, alt, className, sizes, priority, puck } = props;
  if (!name) return null;
  const r = meta(puck).images?.[name];
  if (!r) return null;
  return (
    <img
      src={r.src}
      srcSet={r.srcSet}
      sizes={r.srcSet ? sizes : undefined}
      width={r.width}
      height={r.height}
      alt={alt ?? ''}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  );
}

export function Btn({ b, className, icon }: { b?: Button; className: string; icon?: string }) {
  if (!b?.label || !b?.link) return null;
  const external = b.link.startsWith('http');
  return (
    <a className={className} href={b.link} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {icon && <Icon name={icon} size={18} />}
      {icon && ' '}
      {b.label}
    </a>
  );
}

export function Rich({ value, className }: { value?: ReactNode; className?: string }) {
  if (!value) return null;
  if (typeof value === 'string') return <div className={className} dangerouslySetInnerHTML={{ __html: value }} />;
  return <div className={className}>{value}</div>;
}

function Header({ eyebrow, heading, subtitle, light, level = 'h2' }: { eyebrow?: ReactNode; heading?: ReactNode; subtitle?: ReactNode; light?: boolean; level?: 'h1' | 'h2' }) {
  if (!eyebrow && !heading && !subtitle) return null;
  const H = level;
  return (
    <div className="section-header text-center">
      {eyebrow && <span className={`section-eyebrow${light ? ' light' : ''}`}>{eyebrow}</span>}
      {heading && <H className={`section-title${light ? ' light' : ''}`}>{heading}</H>}
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}

const backgrounds = [
  { label: 'White', value: 'white' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Green', value: 'accent' },
];
const bgClass = (bg?: string) => ({ light: 'bg-light', dark: 'bg-dark-green hr-on-dark', accent: 'bg-accent hr-on-dark' } as Record<string, string>)[bg ?? ''] ?? '';
const padClass = (p?: string) => ({ none: 'hr-pad-none', small: 'hr-pad-small', large: 'hr-pad-large' } as Record<string, string>)[p ?? ''] ?? 'section-pad';

/* ── Layout blocks ───────────────────────────────────────────────────────── */

const Section = {
  label: 'Section (empty container)',
  fields: {
    background: select('Background', backgrounds),
    padding: select('Spacing', [{ label: 'Normal', value: 'normal' }, { label: 'Small', value: 'small' }, { label: 'Large', value: 'large' }, { label: 'None', value: 'none' }]),
    width: select('Width', [{ label: 'Normal', value: 'normal' }, { label: 'Narrow', value: 'narrow' }, { label: 'Wide', value: 'wide' }]),
    content: { type: 'slot' as const },
  },
  defaultProps: { background: 'white', padding: 'normal', width: 'normal', content: [] },
  render: ({ background, padding, width, content: Content }: any) => (
    <section className={`hr-section ${padClass(padding)} ${bgClass(background)}`}>
      <div className={`container ${width === 'narrow' ? 'narrow-container' : ''} ${width === 'wide' ? 'hr-wide' : ''}`}>
        <Content className="hr-stack" minEmptyHeight={120} />
      </div>
    </section>
  ),
};

const Columns = {
  label: 'Columns',
  fields: {
    layout: select('Layout', [
      { label: '2 equal', value: '1-1' },
      { label: '2: narrow + wide', value: '1-2' },
      { label: '2: wide + narrow', value: '2-1' },
      { label: '3 equal', value: '1-1-1' },
      { label: '4 equal', value: '1-1-1-1' },
    ]),
    align: select('Vertical alignment', [{ label: 'Top', value: 'start' }, { label: 'Middle', value: 'center' }]),
    background: select('Background', backgrounds),
    padding: select('Spacing', [{ label: 'Normal', value: 'normal' }, { label: 'Small', value: 'small' }, { label: 'None', value: 'none' }]),
    col1: { type: 'slot' as const },
    col2: { type: 'slot' as const },
    col3: { type: 'slot' as const },
    col4: { type: 'slot' as const },
  },
  defaultProps: { layout: '1-1', align: 'start', background: 'white', padding: 'normal', col1: [], col2: [], col3: [], col4: [] },
  render: ({ layout, align, background, padding, col1: C1, col2: C2, col3: C3, col4: C4 }: any) => {
    const count = layout.split('-').length;
    const cols = [C1, C2, C3, C4].slice(0, count);
    return (
      <section className={`hr-section ${padClass(padding)} ${bgClass(background)}`}>
        <div className={`container hr-columns hr-columns--${layout} hr-align-${align}`}>
          {cols.map((Col, i) => <Col key={i} className="hr-col hr-stack" minEmptyHeight={120} />)}
        </div>
      </section>
    );
  },
};

const Spacer = {
  label: 'Spacer',
  fields: { size: select('Height', [{ label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }]) },
  defaultProps: { size: 'md' },
  render: ({ size }: any) => <div className={`hr-spacer hr-spacer--${size}`} aria-hidden="true" />,
};

const Divider = {
  label: 'Divider line',
  fields: {},
  render: () => <hr className="hr-divider" />,
};

/* ── Basic blocks ────────────────────────────────────────────────────────── */

const Heading = {
  label: 'Heading',
  fields: {
    eyebrow: text('Small label above', true),
    text: text('Heading', true),
    level: select('Level', [{ label: 'Section heading (H2)', value: 'h2' }, { label: 'Sub-heading (H3)', value: 'h3' }, { label: 'Page title (H1)', value: 'h1' }]),
    align: select('Alignment', ['left', 'center']),
  },
  defaultProps: { eyebrow: '', text: 'Heading', level: 'h2', align: 'left' },
  render: ({ eyebrow, text: t, level, align }: any) => {
    const H = level || 'h2';
    return (
      <div className={`hr-heading text-${align}`}>
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <H className={H === 'h3' ? 'hr-h3' : 'section-title'}>{t}</H>
      </div>
    );
  },
};

const RichText = {
  label: 'Text',
  fields: { content: rich('Text'), align: select('Alignment', ['left', 'center']), size: select('Size', [{ label: 'Normal', value: 'normal' }, { label: 'Large', value: 'large' }]) },
  defaultProps: { content: '<p>Write something here.</p>', align: 'left', size: 'normal' },
  render: ({ content, align, size }: any) => <Rich value={content} className={`rich-text text-${align} ${size === 'large' ? 'section-lead' : ''}`} />,
};

const ImageBlock = {
  label: 'Image',
  fields: {
    image: imageField(),
    alt: text('Photo description (for accessibility)'),
    caption: text('Caption', true),
    shape: select('Shape', [{ label: 'Original', value: 'original' }, { label: 'Landscape', value: 'landscape' }, { label: 'Square', value: 'square' }, { label: 'Portrait', value: 'portrait' }]),
    rounded: radio('Rounded corners', yesNo),
  },
  defaultProps: { image: '', alt: '', caption: '', shape: 'original', rounded: true },
  render: ({ image, alt, caption, shape, rounded, puck }: any) =>
    image ? (
      <figure className={`hr-image hr-image--${shape} ${rounded ? 'is-rounded' : ''}`}>
        <Img name={image} alt={alt} sizes="(max-width: 960px) 100vw, 50vw" puck={puck} />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    ) : puck?.isEditing ? (
      <div className="hr-placeholder">Choose a photo in the panel on the right</div>
    ) : null,
};

const ButtonBlock = {
  label: 'Button',
  fields: {
    button: buttonField(),
    style: select('Style', [{ label: 'Solid', value: 'btn-primary' }, { label: 'Outline', value: 'btn-ghost' }, { label: 'White', value: 'btn-white' }]),
    size: select('Size', [{ label: 'Normal', value: '' }, { label: 'Large', value: 'btn-lg' }]),
    align: select('Alignment', ['left', 'center']),
  },
  defaultProps: { button: { label: 'Book a Session', link: '/contact/' }, style: 'btn-primary', size: '', align: 'left' },
  render: ({ button, style, size, align }: any) => (
    <div className={`hr-button text-${align}`}>
      <Btn b={button} className={`btn ${style} ${size}`} />
    </div>
  ),
};

function videoEmbed(url = ''): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`;
  return null;
}

const Video = {
  label: 'Video (YouTube / Vimeo)',
  fields: { url: text('YouTube or Vimeo link'), title: text('Video title (for accessibility)') },
  defaultProps: { url: '', title: 'Video' },
  render: ({ url, title, puck }: any) => {
    const src = videoEmbed(url);
    if (!src) return puck?.isEditing ? <div className="hr-placeholder">Paste a YouTube or Vimeo link in the panel</div> : null;
    return (
      <div className="hr-video">
        <iframe src={src} title={title || 'Video'} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    );
  },
};

const IconCard = {
  label: 'Icon card',
  fields: { icon: iconField(), title: text('Title', true), body: textarea('Text', true) },
  defaultProps: { icon: 'check', title: 'Title', body: 'A short description.' },
  render: ({ icon, title, body }: any) => (
    <div className="concern-card hr-icon-card">
      {icon && <div className="concern-icon"><Icon name={icon} size={36} /></div>}
      <h3 className="concern-title">{title}</h3>
      {body && <p className="concern-desc">{body}</p>}
    </div>
  ),
};

const Quote = {
  label: 'Quote',
  fields: { quote: textarea('Quote', true), cite: text('Who said it', true) },
  defaultProps: { quote: 'Your health is the foundation of everything.', cite: 'Mark' },
  render: ({ quote, cite }: any) => (
    <blockquote className="about-quote inline-quote">
      {quote}
      {cite && <cite>– {cite}</cite>}
    </blockquote>
  ),
};

/* ── Ready-made sections ─────────────────────────────────────────────────── */

const Hero = {
  label: 'Big intro with photo',
  fields: {
    eyebrow: text('Small label above heading', true),
    heading: text('Heading', true),
    subheading: textarea('Subheading', true),
    image: imageField(),
    imageAlt: text('Photo description (for accessibility)'),
    button1: buttonField('Button 1'),
    button2: buttonField('Button 2'),
  },
  defaultProps: { eyebrow: 'Expert Wholistic Care', heading: 'Feel Better, Naturally', subheading: '', image: '', imageAlt: '', button1: { label: 'Explore Services', link: '/services/' }, button2: {} },
  render: ({ eyebrow, heading, subheading, image, imageAlt, button1, button2, puck }: any) => (
    <section className="hero" aria-label="Introduction">
      <div className="hero-bg" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-content">
          {eyebrow && <span className="hero-eyebrow">{eyebrow}</span>}
          <h1 className="hero-heading">{heading}</h1>
          {subheading && <p className="hero-subheading">{subheading}</p>}
          <div className="hero-actions">
            <Btn b={button1} className="btn btn-primary btn-lg" />
            <Btn b={button2} className="btn btn-primary btn-lg" />
          </div>
        </div>
        {image && (
          <div className="hero-image">
            <Img name={image} alt={imageAlt} sizes="(max-width: 960px) 0px, 480px" priority puck={puck} />
          </div>
        )}
      </div>
    </section>
  ),
};

const Banner = {
  label: 'Page banner',
  fields: { eyebrow: text('Small label above heading', true), heading: text('Heading', true), subtitle: text('Subtitle', true), colour: select('Colour', ['teal', 'green', 'amber']) },
  defaultProps: { eyebrow: '', heading: 'Page title', subtitle: '', colour: 'teal' },
  render: ({ eyebrow, heading, subtitle, colour }: any) => (
    <section className={`page-hero page-hero--${colour}`}>
      <div className="container">
        <div className="page-hero-content">
          {eyebrow && <span className="section-eyebrow light">{eyebrow}</span>}
          <h1 className="page-title light">{heading}</h1>
          {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
        </div>
      </div>
    </section>
  ),
};

const TrustBar = {
  label: 'Highlights bar',
  fields: { items: { type: 'array' as const, label: 'Highlights', arrayFields: { icon: iconField(), text: text('Text') }, getItemSummary: (i: any) => i.text || 'Highlight' } },
  defaultProps: { items: [{ icon: 'shield', text: '27+ Years Experience' }] },
  render: ({ items = [] }: any) => (
    <section className="trust-bar" aria-label="At a glance">
      <div className="container">
        <div className="trust-items">
          {items.map((item: any, i: number) => (
            <span key={i} style={{ display: 'contents' }}>
              {i > 0 && <div className="trust-divider" aria-hidden="true" />}
              <div className="trust-item"><Icon name={item.icon} size={28} /><span>{item.text}</span></div>
            </span>
          ))}
        </div>
      </div>
    </section>
  ),
};

const TextSection = {
  label: 'Text section',
  fields: {
    eyebrow: text('Small label above heading', true),
    heading: text('Heading', true),
    body: rich('Text'),
    align: select('Alignment', ['center', 'left']),
    background: select('Background', ['white', 'light']),
  },
  defaultProps: { eyebrow: '', heading: 'Heading', body: '<p>Write something here.</p>', align: 'center', background: 'white' },
  render: ({ eyebrow, heading, body, align, background }: any) => {
    const centered = align !== 'left';
    return (
      <section className={`text-section section-pad ${background === 'light' ? 'bg-light' : ''}`}>
        <div className={`container narrow-container ${centered ? 'text-center' : ''}`}>
          {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
          {heading && <h2 className="section-title">{heading}</h2>}
          <Rich value={body} className={`rich-text ${centered ? 'section-lead' : ''}`} />
        </div>
      </section>
    );
  },
};

const ImageText = {
  label: 'Photo + text',
  fields: {
    eyebrow: text('Small label above heading', true),
    heading: text('Heading', true),
    body: rich('Text'),
    image: imageField(),
    imageAlt: text('Photo description (for accessibility)'),
    style: select('Style', [{ label: 'Light background', value: 'light' }, { label: 'Dark background', value: 'dark' }]),
    quote: text('Quote (optional)', true),
    badgeNumber: text('Photo badge number (e.g. 27+)'),
    badgeLabel: text('Photo badge label'),
    button1: buttonField('Button 1'),
    button2: buttonField('Button 2'),
  },
  defaultProps: { eyebrow: '', heading: 'Heading', body: '<p>Write something here.</p>', image: '', imageAlt: '', style: 'light', quote: '', badgeNumber: '', badgeLabel: '', button1: {}, button2: {} },
  render: (p: any) => {
    const practitioner = meta(p.puck).site?.practitioner ?? '';
    if (p.style === 'dark') {
      return (
        <section className="about-preview section-pad bg-dark-green">
          <div className="container">
            <div className="about-preview-inner">
              {p.image && (
                <div className="about-preview-image">
                  <div className="about-image-frame"><Img name={p.image} alt={p.imageAlt} className="about-photo" sizes="360px" puck={p.puck} /></div>
                </div>
              )}
              <div className="about-preview-content">
                {p.eyebrow && <span className="section-eyebrow light">{p.eyebrow}</span>}
                <h2 className="section-title light">{p.heading}</h2>
                <Rich value={p.body} className="rich-text" />
                {p.quote && <blockquote className="about-quote">{p.quote}<cite>– {practitioner}</cite></blockquote>}
                <div className="about-cta-row">
                  <Btn b={p.button1} className="btn btn-white" />
                  <Btn b={p.button2} className="btn btn-outline-white" />
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }
    return (
      <section className="about-main section-pad">
        <div className="container">
          <div className="about-bio-grid">
            {p.image && (
              <div className="about-bio-image">
                <div className="about-image-wrap">
                  <Img name={p.image} alt={p.imageAlt} className="about-photo" sizes="(max-width: 960px) 100vw, 400px" puck={p.puck} />
                  {p.badgeNumber && (
                    <div className="about-credentials-badge">
                      <span className="badge-number">{p.badgeNumber}</span>
                      <span className="badge-label">{p.badgeLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="about-bio-text">
              {p.eyebrow && <span className="section-eyebrow">{p.eyebrow}</span>}
              <h2 className="section-title">{p.heading}</h2>
              <div className="about-content">
                <Rich value={p.body} className="rich-text" />
                {p.quote && <blockquote className="about-quote inline-quote">{p.quote}<cite>– {practitioner}</cite></blockquote>}
              </div>
              <div className="about-cta-row">
                <Btn b={p.button1} className="btn btn-primary" />
                <Btn b={p.button2} className="btn btn-ghost" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  },
};

const Cards = {
  label: 'Cards',
  fields: {
    eyebrow: text('Small label above heading', true),
    heading: text('Heading', true),
    layout: select('Layout', [{ label: 'Grid (3 across)', value: 'grid' }, { label: 'Compact (2 across)', value: 'compact' }]),
    background: select('Background', ['light', 'white']),
    items: { type: 'array' as const, label: 'Cards', arrayFields: { icon: iconField(), title: text('Title'), desc: textarea('Description') }, getItemSummary: (i: any) => i.title || 'Card' },
  },
  defaultProps: { eyebrow: '', heading: 'Heading', layout: 'grid', background: 'light', items: [{ icon: 'check', title: 'Card title', desc: 'Description' }] },
  render: ({ eyebrow, heading, layout, background, items = [] }: any) => {
    const bg = background === 'white' ? '' : 'bg-light';
    if (layout === 'compact') {
      return (
        <section className={`philosophy-section section-pad ${bg}`}>
          <div className="container narrow-container text-center">
            {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
            {heading && <h2 className="section-title">{heading}</h2>}
            <div className="philosophy-grid">
              {items.map((c: any, i: number) => (
                <div className="philosophy-card" key={i}>
                  {c.icon && <div className="philosophy-icon"><Icon name={c.icon} size={32} /></div>}
                  <h3>{c.title}</h3>
                  {c.desc && <p>{c.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }
    return (
      <section className={`concerns-section section-pad ${bg}`}>
        <div className="container">
          <Header eyebrow={eyebrow} heading={heading} />
          <div className="concerns-grid">
            {items.map((c: any, i: number) => (
              <div className="concern-card" key={i}>
                {c.icon && <div className="concern-icon"><Icon name={c.icon} size={36} /></div>}
                <h3 className="concern-title">{c.title}</h3>
                {c.desc && <p className="concern-desc">{c.desc}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  },
};

const ServicesGrid = {
  label: 'Services grid',
  fields: { eyebrow: text('Small label above heading', true), heading: text('Heading', true), subtitle: textarea('Subtitle', true), button: buttonField() },
  defaultProps: { eyebrow: 'What We Offer', heading: 'Our Therapies', subtitle: '', button: { label: 'View All Services', link: '/services/' } },
  render: ({ eyebrow, heading, subtitle, button, puck }: any) => (
    <section className="services-section section-pad">
      <div className="container">
        <Header eyebrow={eyebrow} heading={heading} subtitle={subtitle} />
        <div className="services-grid">
          {(meta(puck).services ?? []).map((s) => (
            <article className={`service-card service-card--${s.color}`} key={s.slug}>
              <div className="service-card-icon"><Icon name={s.icon} size={40} /></div>
              <div className="service-card-body">
                <h3 className="service-card-title">{s.title}</h3>
                <p className="service-card-excerpt">{s.excerpt}</p>
                <span className="service-duration"><Icon name="clock" size={14} /> {s.duration}</span>
              </div>
              <a className="service-card-link btn btn-ghost" href={`/services/${s.slug}/`}>
                Learn more<span className="visually-hidden"> about {s.title}</span> <Icon name="chevron" size={16} />
              </a>
            </article>
          ))}
        </div>
        {button?.label && <div className="text-center section-footer-cta"><Btn b={button} className="btn btn-primary btn-lg" /></div>}
      </div>
    </section>
  ),
};

const Tags = {
  label: 'Tags list',
  fields: {
    eyebrow: text('Small label above heading', true),
    heading: text('Heading', true),
    items: { type: 'array' as const, label: 'Tags', arrayFields: { label: text('Tag') }, getItemSummary: (i: any) => i.label || 'Tag' },
    button: buttonField(),
  },
  defaultProps: { eyebrow: '', heading: 'Heading', items: [{ label: 'Tag' }], button: {} },
  render: ({ eyebrow, heading, items = [], button }: any) => (
    <section className="modalities-section section-pad">
      <div className="container text-center">
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        {heading && <h2 className="section-title">{heading}</h2>}
        <ul className="modalities-list">{items.map((t: any, i: number) => <li className="modality-tag" key={i}>{t.label}</li>)}</ul>
        <Btn b={button} className="btn btn-primary" />
      </div>
    </section>
  ),
};

const Faq = {
  label: 'FAQ',
  fields: {
    eyebrow: text('Small label above heading', true),
    heading: text('Heading', true),
    items: { type: 'array' as const, label: 'Questions', arrayFields: { q: text('Question'), a: textarea('Answer') }, getItemSummary: (i: any) => i.q || 'Question' },
  },
  defaultProps: { eyebrow: 'Common Questions', heading: 'Frequently Asked Questions', items: [{ q: 'Question?', a: 'Answer.' }] },
  render: ({ id, eyebrow, heading, items = [], puck }: any) => (
    <section className="faq-section section-pad">
      <div className="container narrow-container">
        <Header eyebrow={eyebrow} heading={heading} />
        <div className="faq-list">
          {items.map((f: any, i: number) => {
            const answerId = `${id}-a${i}`;
            const open = !!puck?.isEditing;
            return (
              <div className={`faq-item${open ? ' is-open' : ''}`} key={i}>
                <h3 className="faq-heading">
                  <button className="faq-question" aria-expanded={open} aria-controls={answerId} type="button">
                    {f.q}
                    <span className="faq-icon"><Icon name="caret" size={20} /></span>
                  </button>
                </h3>
                <div className="faq-answer" id={answerId} hidden={!open}><p>{f.a}</p></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  ),
};

const Cta = {
  label: 'Call to action banner',
  fields: { heading: text('Heading', true), subtitle: textarea('Subtitle', true), button1: buttonField('Button 1'), button2: buttonField('Button 2'), note: text('Small note', true) },
  defaultProps: { heading: 'Ready to Start Your Renovation?', subtitle: '', button1: { label: 'Call 0412 567 614', link: 'tel:0412567614' }, button2: { label: 'Send a Message', link: '/contact/' }, note: '' },
  render: ({ heading, subtitle, button1, button2, note }: any) => (
    <section className="booking-cta section-pad bg-accent">
      <div className="container text-center">
        <h2 className="section-title light">{heading}</h2>
        {subtitle && <p className="section-lead light">{subtitle}</p>}
        <div className="cta-actions">
          <Btn b={button1} className="btn btn-white btn-lg" icon={button1?.link?.startsWith('tel:') ? 'phone' : undefined} />
          <Btn b={button2} className="btn btn-outline-white btn-lg" />
        </div>
        {note && <p className="cta-note">{note}</p>}
      </div>
    </section>
  ),
};

const Contact = {
  label: 'Contact form',
  fields: {
    eyebrow: text('Small label above heading', true),
    heading: text('Heading', true),
    intro: textarea('Intro', true),
    showDetails: radio('Show contact details beside the form', yesNo),
    phoneNote: text('Phone note'),
    hoursValue: text('Hours'),
    hoursNote: text('Hours note'),
    noteHeading: text('Extra note heading (optional)'),
    noteText: textarea('Extra note text'),
  },
  defaultProps: { eyebrow: 'Send a Message', heading: 'Make an Enquiry', intro: '', showDetails: true, phoneNote: '', hoursValue: '', hoursNote: '', noteHeading: '', noteText: '' },
  render: (p: any) => {
    const m = meta(p.puck);
    const site = m.site ?? ({} as SiteMeta['site']);
    const tel = telOf(site.phone);
    return (
      <section className="contact-section section-pad">
        <div className="container">
          <div className={`contact-grid${p.showDetails ? '' : ' contact-grid--single'}`}>
            <div className="contact-form-col">
              {p.eyebrow && <span className="section-eyebrow">{p.eyebrow}</span>}
              {p.heading && <h2 className="section-title">{p.heading}</h2>}
              {p.intro && <p className="contact-intro">{p.intro}</p>}
              <form className="contact-form" name="contact" method="POST" action="/thanks/" data-netlify="true" {...{ "netlify-honeypot": "bot-field" }}>
                <input type="hidden" name="form-name" value="contact" />
                <p className="visually-hidden"><label>Leave this empty: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
                <div className="form-row form-row--2">
                  <div className="form-group">
                    <label htmlFor={`${p.id}-name`}>Full Name <span aria-hidden="true">*</span></label>
                    <input type="text" id={`${p.id}-name`} name="name" className="form-input" placeholder="Your name" required autoComplete="name" />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`${p.id}-email`}>Email Address <span aria-hidden="true">*</span></label>
                    <input type="email" id={`${p.id}-email`} name="email" className="form-input" placeholder="your@email.com" required autoComplete="email" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor={`${p.id}-phone`}>Phone Number</label>
                  <input type="tel" id={`${p.id}-phone`} name="phone" className="form-input" placeholder="04xx xxx xxx" autoComplete="tel" />
                </div>
                <div className="form-group">
                  <label htmlFor={`${p.id}-service`}>Service of Interest</label>
                  <select id={`${p.id}-service`} name="service" className="form-input" defaultValue="">
                    <option value="">Select a service (optional)</option>
                    {(m.services ?? []).map((s) => <option key={s.slug} value={s.title}>{s.title}</option>)}
                    <option value="Not sure">Not sure – let's talk</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor={`${p.id}-message`}>Message <span aria-hidden="true">*</span></label>
                  <textarea id={`${p.id}-message`} name="message" className="form-input form-textarea" rows={5} placeholder="Tell Mark a little about yourself and what you'd like help with..." required />
                </div>
                <div className="form-submit-row"><button type="submit" className="btn btn-primary btn-lg btn-submit">Send Message</button></div>
              </form>
            </div>
            {p.showDetails && (
              <div className="contact-info-col">
                <div className="contact-info-card">
                  <h2 className="contact-info-heading">Get in Touch Directly</h2>
                  <div className="contact-info-items">
                    <div className="contact-info-item">
                      <div className="contact-info-icon"><Icon name="phone" /></div>
                      <div>
                        <span className="contact-info-label">Phone / SMS</span>
                        <a className="contact-info-value" href={`tel:${tel}`}>{site.phone}</a>
                        {p.phoneNote && <span className="contact-info-note">{p.phoneNote}</span>}
                      </div>
                    </div>
                    <div className="contact-info-item">
                      <div className="contact-info-icon"><Icon name="mail" /></div>
                      <div>
                        <span className="contact-info-label">Email</span>
                        <a className="contact-info-value" href={`mailto:${site.email}`}>{site.email}</a>
                      </div>
                    </div>
                    <div className="contact-info-item">
                      <div className="contact-info-icon"><Icon name="pin" /></div>
                      <div>
                        <span className="contact-info-label">Location</span>
                        <span className="contact-info-value">{site.suburb}, Victoria</span>
                        <span className="contact-info-note">{site.locationNote}</span>
                      </div>
                    </div>
                    <div className="contact-info-item">
                      <div className="contact-info-icon"><Icon name="clock" /></div>
                      <div>
                        <span className="contact-info-label">Hours</span>
                        <span className="contact-info-value">{p.hoursValue || site.hours}</span>
                        {p.hoursNote && <span className="contact-info-note">{p.hoursNote}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="contact-map-placeholder">
                    <div className="map-embed-placeholder">
                      <Icon name="pin" size={40} />
                      <p>{site.suburb}, Victoria</p>
                      <a className="btn btn-ghost btn-sm" href={`https://maps.google.com/?q=${encodeURIComponent(`${site.suburb} Victoria`)}`} target="_blank" rel="noopener noreferrer">View on Google Maps</a>
                    </div>
                  </div>
                </div>
                {p.noteHeading && (
                  <div className="contact-mobile-note">
                    <h3>{p.noteHeading}</h3>
                    {p.noteText && <p>{p.noteText}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  },
};

const Booking = {
  label: 'Online booking',
  fields: {
    eyebrow: text('Small label above heading', true),
    heading: text('Heading', true),
    intro: textarea('Intro', true),
    url: text("Booking page address from Cliniko / Halaxy / Acuity (blank = 'call to book')"),
    height: { type: 'number' as const, label: 'Height in pixels', min: 400, max: 2000 },
  },
  defaultProps: { eyebrow: '', heading: 'Book an appointment', intro: '', url: '', height: 900 },
  render: ({ eyebrow, heading, intro, url, height, puck }: any) => {
    const site = meta(puck).site ?? ({} as SiteMeta['site']);
    const tel = telOf(site.phone);
    const safeUrl = typeof url === 'string' && url.startsWith('https://') ? url : '';
    return (
      <section className="booking-section section-pad">
        <div className="container">
          <Header eyebrow={eyebrow} heading={heading} subtitle={intro} />
          {safeUrl ? (
            <div className="booking-frame">
              <iframe
                src={safeUrl}
                title={`Book an appointment with ${site.name ?? ''}`}
                height={height || 900}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              />
              <p className="booking-fallback">Booking page not loading? <a href={safeUrl} target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.</p>
            </div>
          ) : (
            <div className="booking-placeholder text-center">
              <p>Online booking is coming soon. In the meantime, call or text {site.practitioner} to book.</p>
              <div className="cta-actions">
                <a className="btn btn-primary btn-lg" href={`tel:${tel}`}><Icon name="phone" size={18} /> Call {site.phone}</a>
                <a className="btn btn-ghost btn-lg" href={`sms:${tel}`}>Send a Text</a>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  },
};

const Gallery = {
  label: 'Photo gallery',
  fields: {
    eyebrow: text('Small label above heading', true),
    heading: text('Heading', true),
    images: {
      type: 'array' as const,
      label: 'Photos',
      arrayFields: { image: imageField(), alt: text('Photo description (for accessibility)'), caption: text('Caption') },
      getItemSummary: (i: any) => i.caption || i.alt || i.image || 'Photo',
    },
  },
  defaultProps: { eyebrow: '', heading: 'Gallery', images: [] },
  render: ({ eyebrow, heading, images = [], puck }: any) => {
    const list = images.filter((g: any) => g.image);
    if (!list.length) return puck?.isEditing ? <div className="hr-placeholder hr-placeholder--section">Add photos to this gallery in the panel on the right. It stays hidden on the site until it has at least one.</div> : null;
    return (
      <section className="gallery-section section-pad">
        <div className="container">
          <Header eyebrow={eyebrow} heading={heading} />
          <div className="gallery-grid">
            {list.map((g: any, i: number) => (
              <figure className="gallery-item" key={i}>
                <Img name={g.image} alt={g.alt} sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw" puck={puck} />
                {g.caption && <figcaption>{g.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  },
};

const Testimonials = {
  label: 'Testimonials',
  fields: { eyebrow: text('Small label above heading', true), heading: text('Heading', true), limit: { type: 'number' as const, label: 'How many to show (0 = all)', min: 0 } },
  defaultProps: { eyebrow: 'Kind Words', heading: 'What Clients Say', limit: 0 },
  render: ({ eyebrow, heading, limit, puck }: any) => {
    const all = meta(puck).testimonials ?? [];
    const items = limit ? all.slice(0, limit) : all;
    if (!items.length) return puck?.isEditing ? <div className="hr-placeholder hr-placeholder--section">No testimonials yet – add them in the Testimonials tab. This section stays hidden on the site until there is at least one.</div> : null;
    return (
      <section className="testimonials-section section-pad bg-light">
        <div className="container">
          <Header eyebrow={eyebrow} heading={heading} />
          <div className="testimonials-grid">
            {items.map((t, i) => (
              <figure className="testimonial-card" key={i}>
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  <span className="testimonial-name">{t.name}</span>
                  {t.detail && <span className="testimonial-detail">{t.detail}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  },
};

const LatestPosts = {
  label: 'Latest articles',
  fields: { eyebrow: text('Small label above heading', true), heading: text('Heading', true), count: { type: 'number' as const, label: 'How many', min: 1, max: 12 } },
  defaultProps: { eyebrow: 'From the Blog', heading: 'Latest Articles', count: 3 },
  render: ({ eyebrow, heading, count, puck }: any) => {
    const posts = (meta(puck).posts ?? []).slice(0, count || 3);
    if (!posts.length) return puck?.isEditing ? <div className="hr-placeholder hr-placeholder--section">No published articles yet – write one in the Blog tab. This section stays hidden on the site until then.</div> : null;
    return (
      <section className="posts-section section-pad">
        <div className="container">
          <Header eyebrow={eyebrow} heading={heading} />
          <div className="posts-grid">
            {posts.map((p) => (
              <article className="post-card" key={p.slug}>
                {p.image && (
                  <a className="post-card-thumbnail" href={`/blog/${p.slug}/`} tabIndex={-1} aria-hidden="true">
                    <Img name={p.image} sizes="(max-width: 960px) 100vw, 33vw" puck={puck} />
                  </a>
                )}
                <div className="post-card-body">
                  <p className="post-card-meta"><time dateTime={p.date}>{new Date(p.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
                  <h3 className="post-card-title"><a href={`/blog/${p.slug}/`}>{p.title}</a></h3>
                  <p className="post-card-excerpt">{p.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="text-center section-footer-cta"><a className="btn btn-ghost" href="/blog/">View all articles</a></div>
        </div>
      </section>
    );
  },
};

export const blocks = {
  Section, Columns, Spacer, Divider,
  Heading, RichText, Image: ImageBlock, Button: ButtonBlock, Video, IconCard, Quote,
  Hero, Banner, TrustBar, TextSection, ImageText, Cards, ServicesGrid, Tags, Faq, Cta, Contact, Booking, Gallery, Testimonials, LatestPosts,
};
