import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'affiliate-links')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Read the file content
    const text = await file.text()
    let data
    let products
    
    try {
      data = JSON.parse(text)
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      )
    }
    
    // Handle both direct array and wrapped format
    if (Array.isArray(data)) {
      // Direct array of products
      products = data
    } else if (data && typeof data === 'object' && Array.isArray(data.products)) {
      // Wrapped format with metadata
      products = data.products
      console.log(`📦 Processing export from folder: ${data.folder?.name || 'unknown'}`)
      console.log(`📅 Export date: ${data.export_date || 'unknown'}`)
      console.log(`📊 Total products in file: ${data.total_products || products.length}`)
    } else {
      return NextResponse.json(
        { success: false, error: 'JSON must be an array of products or contain a products array' },
        { status: 400 }
      )
    }
    
    // Ensure directories exist
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.mkdir(PUBLIC_DATA_DIR, { recursive: true })
    
    // Save to both locations
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    const publicProductsPath = path.join(PUBLIC_DATA_DIR, 'products-index.json')
    
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2))
    await fs.writeFile(publicProductsPath, JSON.stringify(products, null, 2))
    
    console.log(`✅ Imported ${products.length} products to JSON files`)
    
    return NextResponse.json({
      success: true,
      count: products.length,
      message: `Successfully imported ${products.length} products`
    })
    
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to import products',
        details: error.message
      },
      { status: 500 }
    )
  }
}