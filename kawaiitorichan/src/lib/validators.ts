/**
 * Validation utilities for contact form
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Japanese phone number regex (supports various formats)
const PHONE_REGEX = /^(\+81|0)[0-9]{1,4}[-\s]?[0-9]{1,4}[-\s]?[0-9]{3,4}$/

// HTML tag detection regex
const HTML_TAG_REGEX = /<[^>]*>/g

/**
 * Validates email address format
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

/**
 * Validates Japanese phone number format
 * Accepts formats like:
 * - 090-1234-5678
 * - 09012345678
 * - +81-90-1234-5678
 * - 03-1234-5678
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return true // Phone is optional
  const cleaned = phone.replace(/[\s-]/g, '')
  return PHONE_REGEX.test(phone) || PHONE_REGEX.test(cleaned)
}

/**
 * Validates name field
 */
export function validateName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'お名前は必須項目です' }
  }
  if (name.length > 50) {
    return { isValid: false, error: 'お名前は50文字以内で入力してください' }
  }
  if (HTML_TAG_REGEX.test(name)) {
    return { isValid: false, error: '不正な文字が含まれています' }
  }
  return { isValid: true }
}

/**
 * Validates message field
 */
export function validateMessage(message: string): { isValid: boolean; error?: string } {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: 'お問い合わせ内容は必須項目です' }
  }
  if (message.length < 10) {
    return { isValid: false, error: 'お問い合わせ内容は10文字以上で入力してください' }
  }
  if (message.length > 2000) {
    return { isValid: false, error: 'お問い合わせ内容は2000文字以内で入力してください' }
  }
  return { isValid: true }
}

/**
 * Sanitizes input by removing HTML tags and dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(HTML_TAG_REGEX, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
}

/**
 * Normalizes full-width characters to half-width for phone and email
 */
export function normalizeInput(input: string): string {
  return input
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[@＠]/g, '@')
    .replace(/[ー－]/g, '-')
}

/**
 * Validates entire contact form data
 */
export interface ContactFormData {
  name: string
  email: string
  phone?: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: {
    name?: string
    email?: string
    phone?: string
    message?: string
  }
}

export function validateContactForm(data: ContactFormData): ValidationResult {
  const errors: ValidationResult['errors'] = {}
  
  // Validate name
  const nameValidation = validateName(data.name)
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error
  }
  
  // Validate email
  const normalizedEmail = normalizeInput(data.email)
  if (!normalizedEmail || normalizedEmail.trim().length === 0) {
    errors.email = 'メールアドレスは必須項目です'
  } else if (!validateEmail(normalizedEmail)) {
    errors.email = '有効なメールアドレスを入力してください'
  }
  
  // Validate phone (optional)
  if (data.phone) {
    const normalizedPhone = normalizeInput(data.phone)
    if (!validatePhoneNumber(normalizedPhone)) {
      errors.phone = '有効な電話番号を入力してください'
    }
  }
  
  // Validate message
  const messageValidation = validateMessage(data.message)
  if (!messageValidation.isValid) {
    errors.message = messageValidation.error
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Sanitizes all contact form data
 */
export function sanitizeContactFormData(data: ContactFormData): ContactFormData {
  return {
    name: sanitizeInput(data.name),
    email: normalizeInput(sanitizeInput(data.email)),
    phone: data.phone ? normalizeInput(sanitizeInput(data.phone)) : undefined,
    message: sanitizeInput(data.message),
  }
}