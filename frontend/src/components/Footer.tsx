export default function Footer() {
  return (
    <footer className="bg-white border-t mt-auto py-6 px-6 text-center text-sm text-gray-500">
      <p>© {new Date().getFullYear()} Beaverton Rotary Foundation. All rights reserved.</p>
      <p className="mt-1">
        <a href="mailto:scholarships@beavertonrotary.org" className="text-blue-600 hover:underline">
          scholarships@beavertonrotary.org
        </a>
      </p>
    </footer>
  )
}
