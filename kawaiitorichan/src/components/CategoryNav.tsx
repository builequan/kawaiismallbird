'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface Category {
  id: string
  title: string
  slug: string
  description?: string
  parent?: string | { id: string; title: string; slug: string }
  children?: Category[]
}

interface CategoryNavProps {
  categories?: Category[]
  variant?: 'dropdown' | 'sidebar' | 'mobile'
  className?: string
}

export function CategoryNav({ categories = [], variant = 'dropdown', className = '' }: CategoryNavProps) {
  const [organizedCategories, setOrganizedCategories] = useState<Category[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Organize categories into parent-child structure
    const parentCategories = categories.filter(cat => !cat.parent)
    const childCategories = categories.filter(cat => cat.parent)

    const organized = parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => {
        const parentId = typeof child.parent === 'object' ? child.parent.id : child.parent
        return parentId === parent.id
      }),
    }))

    setOrganizedCategories(organized)
  }, [categories])

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`flex items-center gap-1 ${className}`}>
            Categories
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/categories" className="font-semibold">
              All Categories
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {organizedCategories.map((category) => (
            <div key={category.id}>
              {category.children && category.children.length > 0 ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Link href={`/categories/${category.slug}`} className="flex-1">
                      {category.title}
                    </Link>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                      <Link href={`/categories/${category.slug}`} className="font-semibold">
                        All {category.title}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {category.children.map((child) => (
                      <DropdownMenuItem key={child.id} asChild>
                        <Link href={`/categories/${child.slug}`}>
                          {child.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={`/categories/${category.slug}`}>
                    {category.title}
                  </Link>
                </DropdownMenuItem>
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (variant === 'sidebar') {
    return (
      <nav className={`space-y-2 ${className}`}>
        <div className="mb-4">
          <Link 
            href="/categories" 
            className="text-lg font-semibold hover:text-green-600 transition-colors"
          >
            All Categories
          </Link>
        </div>
        {organizedCategories.map((category) => (
          <div key={category.id} className="space-y-1">
            <Link
              href={`/categories/${category.slug}`}
              className="block py-2 px-3 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            >
              {category.title}
            </Link>
            {category.children && category.children.length > 0 && (
              <div className="ml-4 space-y-1">
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/categories/${child.slug}`}
                    className="block py-1 px-3 text-sm text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded transition-colors"
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    )
  }

  if (variant === 'mobile') {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className={className}>
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Categories</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-2">
            <Link 
              href="/categories" 
              className="block py-2 px-3 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              All Categories
            </Link>
            {organizedCategories.map((category) => (
              <div key={category.id} className="space-y-1">
                <Link
                  href={`/categories/${category.slug}`}
                  className="block py-2 px-3 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {category.title}
                </Link>
                {category.children && category.children.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        className="block py-1 px-3 text-sm text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    )
  }

  return null
}

// Server component wrapper to fetch categories
export async function CategoryNavWrapper({ variant = 'dropdown', className = '' }: Omit<CategoryNavProps, 'categories'>) {
  const { getPayload } = await import('payload')
  const config = await import('@payload-config')
  
  const payload = await getPayload({ config: config.default })
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'order',
  })

  return <CategoryNav categories={categories} variant={variant} className={className} />
}