import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-xl m-4">
          <h2 className="text-red-700 font-bold text-xl mb-2">Algo salió mal</h2>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || "Error desconocido"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
          >
            Recargar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;