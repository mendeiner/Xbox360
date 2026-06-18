export default function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
        active
          ? 'bg-xbox border-xbox text-white'
          : 'bg-surface-2 border-surface-4 text-gray-400 hover:border-gray-500 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  )
}
