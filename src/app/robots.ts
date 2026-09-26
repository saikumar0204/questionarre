import type { MetadataRoute } from 'next'
import { SITE } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: ['/', '/privacy', '/terms'], disallow: ['/room/', '/api/', '/j/'] }], sitemap: `https://www.${SITE.domain}/sitemap.xml` }
}
