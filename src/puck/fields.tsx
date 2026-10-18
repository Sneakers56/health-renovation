import { useRef, useState } from 'react';
import { useLibrary } from './library';
import { iconOptions } from './Icon';

function ImagePicker({ value, onChange, readOnly }: { value?: string; onChange: (v: string) => void; readOnly?: boolean }) {
  const { images, upload } = useLibrary();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const names = Object.keys(images).sort();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !upload) return;
    setBusy(true);
    setError('');
    try {
      onChange(await upload(file));
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="hr-imgfield">
      {value && images[value] ? (
        <img className="hr-imgfield-current" src={images[value].src} alt="" />
      ) : (
        <div className="hr-imgfield-empty">{value ? value : 'No photo selected'}</div>
      )}
      {!readOnly && (
        <div className="hr-imgfield-actions">
          <button type="button" onClick={() => setOpen(!open)}>{open ? 'Close' : value ? 'Change photo' : 'Choose photo'}</button>
          {value && <button type="button" onClick={() => onChange('')}>Remove</button>}
        </div>
      )}
      {open && (
        <div className="hr-imgfield-library">
          {upload && (
            <button type="button" className="hr-imgfield-upload" disabled={busy} onClick={() => fileInput.current?.click()}>
              {busy ? 'Uploading…' : '+ Upload new photo'}
            </button>
          )}
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFile} />
          {error && <p className="hr-imgfield-error">{error}</p>}
          <div className="hr-imgfield-grid">
            {names.map((name) => (
              <button type="button" key={name} title={name} className={name === value ? 'is-selected' : ''} onClick={() => { onChange(name); setOpen(false); }}>
                <img src={images[name].src} alt={name} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const imageField = (label = 'Photo') => ({
  type: 'custom' as const,
  label,
  render: ({ value, onChange, readOnly }: any) => <ImagePicker value={value} onChange={onChange} readOnly={readOnly} />,
});

export const buttonField = (label = 'Button') => ({
  type: 'object' as const,
  label,
  objectFields: {
    label: { type: 'text' as const, label: 'Text' },
    link: { type: 'text' as const, label: 'Link (/page/, tel:…, sms:…, https://…)' },
  },
});

export const iconField = (label = 'Icon') => ({ type: 'select' as const, label, options: [{ label: '(none)', value: '' }, ...iconOptions] });

export const text = (label: string, inline = false) => ({ type: 'text' as const, label, ...(inline ? { contentEditable: true } : {}) });
export const textarea = (label: string, inline = false) => ({ type: 'textarea' as const, label, ...(inline ? { contentEditable: true } : {}) });
export const rich = (label: string) => ({
  type: 'richtext' as const,
  label,
  contentEditable: true,
  options: { heading: { levels: [2, 3] as (2 | 3)[] }, codeBlock: false as const, code: false as const },
});
export const select = (label: string, options: (string | { label: string; value: string })[]) => ({
  type: 'select' as const,
  label,
  options: options.map((o) => (typeof o === 'string' ? { label: o[0].toUpperCase() + o.slice(1), value: o } : o)),
});
export const radio = (label: string, options: { label: string; value: any }[]) => ({ type: 'radio' as const, label, options });
