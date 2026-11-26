import { useState, useRef } from "react";
import { Upload, X, Link as LinkIcon, Image as ImageIcon, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ImageUploader({ label, onChange, type = "logo", initialPreview = "" }) {
  const [preview, setPreview] = useState(initialPreview);
  const [useUrl, setUseUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setSubiendo(true);

    try {
      const formData = new FormData();
      formData.append("archivo", file);
      formData.append("tipo", type);

      // Normaliza la URL (quita /graphql/ si lo tiene)
      const baseUrl = API_URL.replace(/\/graphql\/?$/, "").replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/api/upload/`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Error al subir la imagen.");
      }

      setPreview(`${baseUrl}${data.url}`);
      onChange({ file: null, url: data.url });
    } catch (err) {
      setError(err.message);
      setPreview(null);
    } finally {
      setSubiendo(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      setPreview(urlInput);
      onChange({ file: null, url: urlInput });
    }
  };

  const removeImage = () => {
    setPreview(null);
    setUrlInput("");
    setError("");
    onChange({ file: null, url: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</label>
        <button
          type="button"
          onClick={() => setUseUrl(!useUrl)}
          className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
        >
          {useUrl ? (
            <><Upload className="w-3 h-3" /> Subir archivo</>
          ) : (
            <><LinkIcon className="w-3 h-3" /> Usar URL</>
          )}
        </button>
      </div>

      {preview ? (
        <div
          className={`relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${
            type === "logo" ? "h-32" : "h-48"
          }`}
        >
          <img
            src={preview}
            alt="Preview"
            className={`object-contain p-2 ${
              type === "logo" ? "max-h-24 max-w-full" : "w-full h-full object-cover"
            }`}
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-white dark:bg-gray-900 text-red-500 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : subiendo ? (
        <div
          className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 ${
            type === "logo" ? "h-32" : "h-48"
          }`}
        >
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Subiendo imagen...</p>
        </div>
      ) : useUrl ? (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="input-field flex-1"
          />
          <button type="button" onClick={handleUrlSubmit} className="btn-secondary px-4">
            Cargar
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            type === "logo" ? "h-32" : "h-48"
          }`}
        >
          <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Haz clic para subir</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP hasta 5MB</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
          {error}
        </p>
      )}

      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}