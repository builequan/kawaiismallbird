import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'affiliate-links')

export async function DELETE(request: NextRequest) {
  try {
    // Remove product files
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    const publicProductsPath = path.join(PUBLIC_DATA_DIR, 'products-index.json')
    
    // Write empty array to both files
    const emptyProducts = '[]'
    
    await fs.writeFile(productsPath, emptyProducts).catch(() => {})
    await fs.writeFile(publicProductsPath, emptyProducts).catch(() => {})
    
    // Also remove related files if they exist
    const relatedFiles = [
      'similarity-matrix.json',
      'similarity-stats.json',
      'embeddings.json'
    ]
    
    for (const file of relatedFiles) {
      await fs.unlink(path.join(DATA_DIR, file)).catch(() => {})
      await fs.unlink(path.join(PUBLIC_DATA_DIR, file)).catch(() => {})
    }
    
    console.log(' All products removed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'All products removed successfully'
    })
    
  } catch (error: any) {
    console.error('Remove products error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to remove products',
        details: error.message
      },
      { status: 500 }
    )
  }
}