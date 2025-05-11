export default function PreferencesToggleButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="fixed top-4 right-4 z-50 bg-white text-gray-800 border border-gray-300 px-3 py-2 rounded-full shadow hover:bg-gray-100 transition"
        >
            Preferencias ⚙️
        </button>
    );
}
