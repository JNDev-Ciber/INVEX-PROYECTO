
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
} from "lucide-react";
import type { RefObject } from "react";

interface ImageSectionProps {
  isDark: boolean;
  dragActive: boolean;
  imagePreview: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  imageError?: string;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: () => void;
}

export function ImageSection({
  dragActive,
  imagePreview,
  fileInputRef,
  imageError,
  handleDrag,
  handleDrop,
  handleFileSelect,
  removeImage,
}: ImageSectionProps) {
  return (
    <div className="lg:col-span-4 space-y-3">
      <h3 className="text-base font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
        <ImageIcon className="h-4 w-4" />
        Imagen
      </h3>

      <div
        className={`
                    relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
                    ${
                      dragActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }
                  `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload
            className={`h-8 w-8 ${
              dragActive ? "text-blue-500" : "text-gray-400"
            }`}
          />
          <p
            className={`text-sm ${
              dragActive ? "text-blue-600" : "text-gray-600"
            }`}
          >
            {dragActive
              ? "Suelta la imagen aquí"
              : "Arrastra una imagen o haz clic"}
          </p>
          <p className="text-xs text-gray-500">PNG/JPG/GIF (5MB)</p>
        </div>
      </div>

      {imageError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{imageError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Vista previa</Label>
        <div
          className={`
                    relative border-2 border-dashed rounded-lg p-3 min-h-[160px] flex items-center justify-center
                    border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800
                  `}
        >
          {imagePreview ? (
            <div className="relative w-full h-full">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full max-h-[140px] object-contain rounded"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Sin imagen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
