/** "Sube" una imagen: la deja como data URL en memoria (no hay storage remoto). */
export function uploadImage(file: File): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ secure_url: String(reader.result) });
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}
