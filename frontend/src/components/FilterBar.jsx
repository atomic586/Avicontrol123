import { Search, Filter } from "lucide-react";

export default function FilterBar({
  busqueda, setBusqueda,
  filtros, filtroActivo, setFiltroActivo,
  placeholder = "Buscar...",
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
        <Filter className="w-5 h-5 text-gray-400 flex-shrink-0 mr-1" />
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroActivo(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              filtroActivo === f.value
                ? "bg-dark dark:bg-white text-white dark:text-dark shadow-md"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}