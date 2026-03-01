"use client";

import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PercentCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";

export interface ImageEditProps {
  /** Image source (URL or base64) for cropping */
  src: string;
  /** Aspect ratio (e.g. 1 for square, 16/9 for landscape). Omit for free-form. */
  aspectRatio?: number;
  /** When true, aspect ratio is ignored and edge handles (n,e,s,w) are shown for flexible cropping */
  allowFreeCrop?: boolean;
  /** Max width for output image in pixels */
  maxWidth?: number;
  /** Max height for output image in pixels */
  maxHeight?: number;
  /** Called when user clicks apply with base64 data URL and mime type */
  onCropComplete?: (base64: string, mimeType: string) => void;
  /** Disable interaction */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Show apply button (default true). When false, use ref.getCroppedImage() */
  showApplyButton?: boolean;
  /** Max display height in px for the crop preview (default 400). Helps in constrained dialogs. */
  maxDisplayHeight?: number;
}

export interface ImageEditHandle {
  getCroppedImage: () => Promise<{ base64: string; mimeType: string } | null>;
}

function getCroppedImage(
  image: HTMLImageElement,
  crop: PercentCrop,
  mimeType: string,
  maxWidth?: number,
  maxHeight?: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const { naturalWidth, naturalHeight } = image;
    const x = (crop.x / 100) * naturalWidth;
    const y = (crop.y / 100) * naturalHeight;
    const w = (crop.width / 100) * naturalWidth;
    const h = (crop.height / 100) * naturalHeight;

    let outW = w;
    let outH = h;
    if (maxWidth && maxHeight) {
      const scale = Math.min(maxWidth / w, maxHeight / h, 1);
      outW = w * scale;
      outH = h * scale;
    } else if (maxWidth && w > maxWidth) {
      const scale = maxWidth / w;
      outW = maxWidth;
      outH = h * scale;
    } else if (maxHeight && h > maxHeight) {
      const scale = maxHeight / h;
      outW = w * scale;
      outH = maxHeight;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(outW);
    canvas.height = Math.round(outH);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }
    ctx.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL(mimeType);
    resolve(base64);
  });
}

export const ImageEdit = forwardRef<ImageEditHandle, ImageEditProps>(
  function ImageEdit(
    {
      src,
      aspectRatio,
      allowFreeCrop = false,
      maxWidth,
      maxHeight,
      onCropComplete,
      disabled = false,
      className,
      showApplyButton = true,
      maxDisplayHeight = 400,
    },
    ref
  ) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const completedCropRef = useRef<PercentCrop | null>(null);

    const effectiveAspect = allowFreeCrop ? undefined : aspectRatio;

    const onImageLoad = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        const defaultCrop = effectiveAspect
          ? centerCrop(
              makeAspectCrop(
                { unit: "%", width: 90 },
                effectiveAspect,
                naturalWidth,
                naturalHeight
              ),
              naturalWidth,
              naturalHeight
            )
          : ({
              unit: "%" as const,
              x: 10,
              y: 10,
              width: 80,
              height: 80,
            } as Crop);
        setCrop(defaultCrop);
        completedCropRef.current = defaultCrop as PercentCrop;
      },
      [effectiveAspect]
    );

    const onCropChange = useCallback((c: Crop, percentCrop: PercentCrop) => {
      setCrop(percentCrop as Crop);
      completedCropRef.current = percentCrop;
    }, []);

    const produceCroppedImage = useCallback(async () => {
      if (!imgRef.current || !completedCropRef.current) return null;
      const mimeMatch = /^data:([^;]+);/.exec(src);
      const mimeType = mimeMatch?.[1] ?? "image/png";
      const outMime = mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
      const base64 = await getCroppedImage(
        imgRef.current,
        completedCropRef.current,
        outMime,
        maxWidth,
        maxHeight
      );
      return { base64, mimeType: outMime };
    }, [src, maxWidth, maxHeight]);

    useImperativeHandle(ref, () => ({
      getCroppedImage: produceCroppedImage,
    }));

    const handleApply = useCallback(async () => {
      const result = await produceCroppedImage();
      if (result && onCropComplete) {
        onCropComplete(result.base64, result.mimeType);
      }
    }, [produceCroppedImage, onCropComplete]);

    return (
      <div className={className}>
        <ReactCrop
          crop={crop}
          onChange={onCropChange}
          onComplete={(_, percentCrop) => {
            completedCropRef.current = percentCrop;
          }}
          aspect={effectiveAspect}
          disabled={disabled}
        >
          <Image
            src={src}
            alt="Crop"
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              if (target) imgRef.current = target;
              onImageLoad(e as React.SyntheticEvent<HTMLImageElement>);
            }}
            width={800}
            height={maxDisplayHeight}
            style={{ maxHeight: maxDisplayHeight, width: "auto", height: "auto" }}
            unoptimized
          />
        </ReactCrop>
        {showApplyButton && (
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={handleApply}
            disabled={disabled || !completedCropRef.current}
          >
            Kırpmayı Uygula
          </Button>
        )}
      </div>
    );
  }
);
