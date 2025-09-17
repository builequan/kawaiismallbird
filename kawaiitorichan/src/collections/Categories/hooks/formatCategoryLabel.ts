import type { FieldHook } from 'payload'

export const formatCategoryLabel: FieldHook = async ({ 
  data, 
  originalDoc,
  req,
}) => {
  // This hook formats the category display to show parent hierarchy
  if (data?.parent && typeof data.parent === 'object') {
    // If parent exists, format as "Parent > Child"
    return `${data.parent.title} > ${data.title}`
  }
  
  return data?.title
}