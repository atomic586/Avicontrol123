import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-hueso px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-6xl mb-3">🥚</div>
        <h1 className="text-3xl font-bold text-mostaza-700 mb-1">AVICONTROL</h1>
        <p className="text-gray-500 mb-6">Sistema de Gestión Avícola</p>
        <Link to="/login" className="btn-primary inline-block">
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}