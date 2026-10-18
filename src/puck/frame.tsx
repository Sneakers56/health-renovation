const FONTS =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap';

/** Loads the site's real stylesheet inside the editor canvas (live pages get it from the Astro layout). */
export function EditorStyles() {
  return (
    <>
      <link rel="stylesheet" href={FONTS} />
      <link rel="stylesheet" href="/editor/site.css" />
    </>
  );
}
