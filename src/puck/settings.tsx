import { EditorStyles } from './frame';
import { Icon } from './Icon';
import { text, textarea, radio, select } from './fields';

/* Settings are single JSON files edited through the right-hand panel; the canvas shows a preview. */

const link = { label: text('Text'), link: text('Link (/page/ or https://…)') };

function Preview({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <>
      <EditorStyles />
      <section className="section-pad bg-light" style={{ minHeight: '100vh' }}>
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">Preview</span>
            <h1 className="section-title">{title}</h1>
            {note && <p className="section-subtitle">{note}</p>}
          </div>
          {children}
        </div>
      </section>
    </>
  );
}

export const navigationConfig = {
  root: {
    fields: {
      items: {
        type: 'array' as const,
        label: 'Menu links',
        arrayFields: {
          ...link,
          servicesDropdown: radio('Show all services in a dropdown', [{ label: 'No', value: false }, { label: 'Yes', value: true }]),
          children: { type: 'array' as const, label: 'Extra dropdown links', arrayFields: link, getItemSummary: (c: any) => c.label || 'Link' },
        },
        defaultItemProps: { label: 'New link', link: '/', servicesDropdown: false, children: [] },
        getItemSummary: (i: any) => `${i.label || 'Link'} → ${i.link || ''}`,
      },
      button: { type: 'object' as const, label: 'Highlighted menu button', objectFields: link },
    },
    render: ({ items = [], button, puck }: any) => {
      const services = puck?.metadata?.services ?? [];
      return (
        <Preview title="Menu" note="Edit the links in the panel on the right, then Publish. The footer’s Quick Links use the same list.">
          <div className="hr-menu-preview">
            {items.map((item: any, i: number) => {
              const kids = [
                ...(item.servicesDropdown ? services.map((s: any) => ({ label: s.title, link: `/services/${s.slug}/` })) : []),
                ...(item.children ?? []),
              ];
              return (
                <div className="hr-menu-preview-item" key={i}>
                  <strong>{item.label}</strong> <span>{item.link}</span>
                  {kids.length > 0 && <ul>{kids.map((k: any, j: number) => <li key={j}>{k.label} <span>{k.link}</span></li>)}</ul>}
                </div>
              );
            })}
            {button?.label && <span className="btn btn-primary">{button.label}</span>}
          </div>
        </Preview>
      );
    },
  },
  components: {},
};

export const testimonialsConfig = {
  root: {
    fields: {
      testimonials: {
        type: 'array' as const,
        label: 'Testimonials',
        arrayFields: { quote: textarea('Quote'), name: text('Name (e.g. Sarah K.)'), detail: text('Detail (e.g. Kinesiology client)') },
        defaultItemProps: { quote: '', name: '', detail: '' },
        getItemSummary: (t: any) => t.name || 'Testimonial',
      },
    },
    render: ({ testimonials = [] }: any) => (
      <Preview title="Testimonials" note="Only add genuine testimonials you have permission to use. Show them on any page with a Testimonials block.">
        {testimonials.length ? (
          <div className="testimonials-grid">
            {testimonials.map((t: any, i: number) => (
              <figure className="testimonial-card" key={i}>
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  <span className="testimonial-name">{t.name}</span>
                  {t.detail && <span className="testimonial-detail">{t.detail}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="hr-placeholder">No testimonials yet – add one in the panel on the right.</p>
        )}
      </Preview>
    ),
  },
  components: {},
};

export const siteConfig = {
  root: {
    fields: {
      name: text('Business name'),
      practitioner: text('Practitioner name'),
      tagline: text('Footer tagline'),
      phone: text('Phone'),
      email: text('Email'),
      suburb: text('Suburb'),
      state: text('State'),
      postcode: text('Postcode'),
      locationNote: text('Location note'),
      hours: text('Hours (short)'),
      social: {
        type: 'array' as const,
        label: 'Social links',
        arrayFields: { network: select('Network', ['Facebook', 'Instagram', 'LinkedIn']), url: text('URL') },
        defaultItemProps: { network: 'Facebook', url: '' },
        getItemSummary: (s: any) => s.network || 'Link',
      },
      announcement: {
        type: 'object' as const,
        label: 'Announcement bar (top of every page)',
        objectFields: {
          enabled: radio('Show announcement', [{ label: 'No', value: false }, { label: 'Yes', value: true }]),
          text: text('Text'),
          link: text('Link (optional)'),
        },
      },
      googleAnalyticsId: text('Google Analytics ID (G-XXXXXXX, optional)'),
    },
    render: (s: any) => (
      <>
        {s.announcement?.enabled && s.announcement?.text && <div className="announcement-bar"><span>{s.announcement.text}</span></div>}
        <Preview title="Business details" note="Used across the site: header, footer, contact page, sticky Call button and Google listing data.">
          <div className="contact-info-card" style={{ maxWidth: 520, margin: '0 auto' }}>
            <h2 className="contact-info-heading">{s.name}</h2>
            <div className="contact-info-items">
              {[
                ['phone', 'Phone', s.phone],
                ['mail', 'Email', s.email],
                ['pin', 'Location', `${s.suburb ?? ''} ${s.state ?? ''} ${s.postcode ?? ''}`, s.locationNote],
                ['clock', 'Hours', s.hours],
                ['person', 'Practitioner', s.practitioner],
              ].map(([icon, label, value, note]) => (
                <div className="contact-info-item" key={label}>
                  <div className="contact-info-icon"><Icon name={icon} /></div>
                  <div>
                    <span className="contact-info-label">{label}</span>
                    <span className="contact-info-value">{value}</span>
                    {note && <span className="contact-info-note">{note}</span>}
                  </div>
                </div>
              ))}
            </div>
            {s.tagline && <p className="contact-intro" style={{ marginTop: '1rem' }}>{s.tagline}</p>}
          </div>
        </Preview>
      </>
    ),
  },
  components: {},
};
