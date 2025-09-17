'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import React, { useState } from 'react'

import type { Theme } from './types'

import { useTheme } from '..'
import { themeLocalStorageKey } from './types'

export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()
  const [value, setValue] = useState('light')

  const onThemeChange = (themeToSet: Theme & 'auto') => {
    if (themeToSet === 'auto') {
      setTheme(null)
      setValue('auto')
    } else {
      setTheme(themeToSet)
      setValue(themeToSet)
    }
  }

  React.useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey)
    setValue(preference ?? 'light')
  }, [])

  return (
    <Select onValueChange={onThemeChange} value={value}>
      <SelectTrigger
        aria-label="Select a theme"
        className="w-auto bg-transparent gap-2 pl-0 md:pl-3 border border-gray-600 text-white hover:border-primary transition-colors rounded-lg"
      >
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <SelectItem value="auto" className="text-gray-900 dark:text-gray-100">Auto</SelectItem>
        <SelectItem value="light" className="text-gray-900 dark:text-gray-100">Light</SelectItem>
        <SelectItem value="dark" className="text-gray-900 dark:text-gray-100">Dark</SelectItem>
      </SelectContent>
    </Select>
  )
}
