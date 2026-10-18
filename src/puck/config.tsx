import type { ReactNode } from 'react';
import { blocks } from './blocks';
import { text, textarea, radio } from './fields';

const FONTS = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap';

export type PageRoot ={ title?: string; seoTitle?: string; seoDescription?: string; noindex?: boolean };

export const config = {
  categories: {
    layout: { title: 'Layout', components: ['Section', 'Columns', 'Spacer', 'Divider'] },
    basics: { title: 'Basics', components: ['Heading', 'RichText', 'Image', 'Button', 'Video', 'IconCard', 'Quote'] },
    sections: {
      title: 'Ready-made sections',
      components: ['Hero', 'Banner', 'TrustBar', 'TextSection', 'ImageText', 'Cards', 'ServicesGrid', 'Tags', 'Faq', 'Cta', 'Contact', 'Booking', 'Gallery', 'Testimonials', 'LatestPosts'],
    },
  },
  root: {
    fields: {
      title: text('Page title'),
      seoTitle: text('Title in Google (blank = page title)'),
      seoDescription: textarea('Description in Google (about 150 characters)'),
      noindex: radio('Hide this page from search engines', [{ label: 'No', value: false }, { label: 'Yes', value: true }]),
    },
    defaultProps: { title: 'New page', seoTitle: '', seoDescription: '', noindex: false },
    render: ({ children, puck }: { children: ReactNode; puck: any }) =>
      puck?.isEditing ? (
        <>
          <link rel="stylesheet" href={FONTS} />
          <link rel="stylesheet" href="/admin/preview.css" />
          <main className="site-main hr-editing">{children}</main>
        </>
      ) : (
        <>{children}</>
      ),
  },
  components: withHideToggle(blocks),
};

/** Adds a 'Hide on site' switch to every block. Hidden blocks are dimmed in the editor and skipped on the site. */
function withHideToggle<T extends Record<string, any>>(components: T): T {
  const out: Record<string, any> = {};
  for (const [name, c] of Object.entries(components)) {
    out[name] = {
      ...c,
      fields: { ...c.fields, hidden: radio('Hide on site', [{ label: 'No', value: false }, { label: 'Yes', value: true }]) },
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
