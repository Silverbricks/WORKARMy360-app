export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-[#64748B] sm:flex-row">
        <span>© {new Date().getFullYear()} Aussie Work Force Pty Ltd · WorkArmy for Business</span>
        <span>Made in Australia 🇦🇺</span>
      </div>
    </footer>
  );
}
