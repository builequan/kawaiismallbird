import './globals.css'

export const metadata = {
  title: 'Admin - Kawaii Bird CMS',
  description: 'Admin panel for Kawaii Bird CMS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="admin-page">{children}</body>
    </html>
  )
}
