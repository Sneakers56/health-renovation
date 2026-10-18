import { Render } from '@puckeditor/core/rsc';
import { config } from './config';
import type { SiteMeta } from './types';

export default function PageRender({ data, metadata }: { data: any; metadata: SiteMeta }) {
  return <Render config={config as any} data={data} metadata={metadata as any} />;
}
