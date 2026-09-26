import type { MetadataRoute } from 'next'
import { SITE } from '@/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://www.${SITE.domain}`
  return [{ url: base, priority: 1 }, { url: `${base}/privacy` }, { url: `${base}/terms` }]
}
