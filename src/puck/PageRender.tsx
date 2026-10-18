import { Render } from '@puckeditor/core/rsc';
import { configs, type DocKind } from './config';
import type { SiteMeta } from './types';

export default function PageRender({ data, metadata, kind = 'page' }: { data: any; metadata: SiteMeta; kind?: DocKind }) {
  return <Render config={configs[kind] as any} data={data} metadata={metadata as any} />;
}
