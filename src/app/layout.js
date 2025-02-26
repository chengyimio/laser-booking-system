import './globals.css'

export const metadata = {
  title: '雷切機預約系統',
  description: '雷切機預約管理平台',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}