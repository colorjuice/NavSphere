import { NavigationContent } from '@/components/navigation-content'
import { getFileContent } from '@/lib/github'
import type { NavigationData } from '@/types/navigation'
import type { SiteConfig } from '@/types/site'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const defaultSiteConfig: SiteConfig = {
  basic: {
    title: '自用导航',
    description: '我的专属导航平台',
    keywords: ''
  },
  appearance: {
    logo: '',
    favicon: '',
    theme: 'system'
  },
  navigation: {
    linkTarget: '_blank'
  }
}

export default async function Home() {
  const navigationData = (await getFileContent('src/navsphere/content/navigation.json')) as NavigationData
  const rawSite = (await getFileContent('src/navsphere/content/site.json')) as SiteConfig

  // 安全兜底，确保 appearance 和 logo 属性永久有效，绝不报错
  const siteData: SiteConfig = {
    ...defaultSiteConfig,
    ...(rawSite || {}),
    basic: { ...defaultSiteConfig.basic, ...(rawSite?.basic || {}) },
    appearance: { ...defaultSiteConfig.appearance, ...(rawSite?.appearance || {}) },
    navigation: { ...defaultSiteConfig.navigation, ...(rawSite?.navigation || {}) }
  }

  return (
    <main>
      <NavigationContent 
        navigationData={navigationData?.navigationItems ? navigationData : { navigationItems: [] }} 
        siteData={siteData} 
      />
    </main>
  )
}
