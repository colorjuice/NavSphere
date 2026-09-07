import { auth } from '@/lib/auth'
import { stringToBase64 } from '@/lib/buffer-utils'

export async function getFileContent(path: string) {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const branch = process.env.GITHUB_BRANCH || 'main'

  const defaultSite = {
    basic: { title: '自用导航', description: '', keywords: '' },
    appearance: { logo: '', favicon: '', theme: 'system' },
    navigation: { linkTarget: '_blank' }
  }

  try {
    const session = await auth()
    const token = session?.user?.accessToken

    let response: Response

    if (token) {
      // 登录状态使用 GitHub API
      response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: {
          Accept: 'application/vnd.github.v3.raw',
          Authorization: `token ${token}`,
          'User-Agent': 'NavSphere',
        },
        cache: 'no-store'
      })
    } else {
      // 未登录访客直接使用 raw 链接读取，永久稳定且没有每小时 60 次的限制
      response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`, {
        headers: {
          'User-Agent': 'NavSphere',
        },
        cache: 'no-store'
      })
    }

    if (response.ok) {
      return await response.json()
    }

    // 备用 CDN 降级读取
    const cdnResponse = await fetch(`https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`, {
      cache: 'no-store'
    })
    if (cdnResponse.ok) {
      return await cdnResponse.json()
    }

    if (path.includes('navigation.json')) {
      return { navigationItems: [] }
    }
    return defaultSite
  } catch (error) {
    console.error('Error fetching file:', error)
    if (path.includes('navigation.json')) {
      return { navigationItems: [] }
    }
    return defaultSite
  }
}

export async function commitFile(
  path: string,
  content: string,
  message: string,
  token: string,
  retryCount = 3
) {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const branch = process.env.GITHUB_BRANCH || 'main'

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      // 1. 获取当前文件信息
      const currentFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      const currentFileResponse = await fetch(currentFileUrl, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'NavSphere',
        },
        cache: 'no-store',
      })

      let sha = undefined
      if (currentFileResponse.ok) {
        const currentFile = await currentFileResponse.json()
        sha = currentFile.sha
      }

      // 2. 创建或更新文件
      const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'NavSphere',
        },
        body: JSON.stringify({
          message,
          content: stringToBase64(content),
          sha,
          branch,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (attempt < retryCount && error.message?.includes('sha')) {
          await delay(1000 * attempt)
          continue
        }
        throw new Error(`Failed to commit file: ${error.message}`)
      }

      return await response.json()
    } catch (error) {
      if (attempt === retryCount) {
        console.error('Error in commitFile:', error)
        throw error
      }
      await delay(1000 * attempt)
    }
  }
}
