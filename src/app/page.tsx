import { NavigationContent } from '@/components/navigation-content'
import { getFileContent } from '@/lib/github'
import type { NavigationData } from '@/types/navigation'
import type { SiteConfig } from '@/types/site'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default async function Home() {
  const navigationData = (await getFileContent('src/navsphere/content/navigation.json')) as NavigationData
  const siteData = (await getFileContent('src/navsphere/content/site.json')) as SiteConfig

  return (
    <main>
      <NavigationContent navigationData={navigationData} siteData={siteData} />
    </main>
  )
}
