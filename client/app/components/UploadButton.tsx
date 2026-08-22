"use-client";
import Image from "next/image";
import { useEffect, useState } from "react";

interface UploadButtonProps {
  onUpload: (file: File | null) => void;
  imagePreview?: string;
}

export const UploadButton = ({ onUpload, imagePreview }: UploadButtonProps) => {
  const [imgPreview, setImgPreview] = useState<string>("");

  useEffect(() => {
    if (imagePreview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImgPreview(imagePreview);
    }
  }, [imagePreview]);
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    onUpload(file);

    const imgUrl = URL.createObjectURL(file);
    setImgPreview(imgUrl);
  };
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Banner image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none"
        />
        <p className="mt-2 text-xs text-zinc-500">
          You can upload a banner image and it will be stored as a data URL for
          this demo.
        </p>

        {imgPreview && (
          <div className="mt-2">
            <Image
              width={800}
              height={320}
              src={imgPreview}
              alt="Preview"
              className="max-h-32 rounded-lg border border-zinc-200 object-cover"
            />
          </div>
        )}
      </div>
    </>
  );
};
