import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

// Static footer links for legal pages
const staticFooterLinks = [
  { href: '/about-us', label: 'サイトについて' },
  { href: '/team', label: '編集部紹介' },
  { href: '/privacy-policy', label: 'プライバシーポリシー' },
  { href: '/terms-of-service', label: '利用規約' },
  { href: '/contact', label: 'お問い合わせ' },
]

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t border-border bg-black dark:bg-gray-900 text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <div className="flex flex-col gap-4">
          <Link className="flex items-center" href="/">
            <Logo />
          </Link>
          <p className="text-sm text-gray-400 max-w-md">
            小鳥の飼育歴10年以上の愛鳥家チームが運営する、獣医師監修の信頼性の高い小鳥飼育情報サイトです。
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
            <ThemeSelector />
            <nav className="flex flex-col md:flex-row gap-4">
              {navItems.map(({ link }, i) => {
                return <CMSLink className="text-white hover:text-primary transition-colors" key={i} {...link} />
              })}
            </nav>
          </div>

          {/* Static legal links */}
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {staticFooterLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 py-4">
        <div className="container text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Kawaii Bird. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
