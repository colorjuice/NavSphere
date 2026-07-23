'use client'

import { useState, useEffect } from 'react'
import { LetterAvatar } from './letter-avatar'

interface SiteFaviconProps {
  title: string
  icon?: string
  useDefaultIcon?: boolean
  className?: string
}

export function SiteFavicon({ title, icon, useDefaultIcon, className }: SiteFaviconProps) {
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setErrored(false)
  }, [icon])

  if (useDefaultIcon || !icon || errored) {
    return <LetterAvatar title={title} className={className} />
  }

  // 核心：自动把系统生成的 /assets/ 相对路径实时转换为免配置的 jsDelivr CDN 链接
  const displayIcon = icon.startsWith('/assets/')
    ? `https://cdn.jsdelivr.net/gh/colorjuice/navsphere-data@main/public${icon}`
    : icon

  return (
    <img
      src={displayIcon}
      alt={`${title} icon`}
      className={className}
      onError={() => setErrored(true)}
    />
  )
}
