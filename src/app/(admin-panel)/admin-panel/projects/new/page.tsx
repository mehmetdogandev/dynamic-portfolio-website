"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageEdit, type ImageEditHandle } from "@/components/ui/image-edit";
import { RichTextEditor } from "@/components/rich-text-editor";
import { api } from "@/lib/trpc/react";
import { getErrorMessage } from "@/lib/trpc/error-messages";
import Image from "next/image";
import { slugify } from "@/lib/utils/slugify";
import { ArrowLeft, X } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [order, setOrder] = useState(0);
  const [coverPreviewSrc, setCoverPreviewSrc] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [coverMime, setCoverMime] = useState("image/png");
  const [freeCrop, setFreeCrop] = useState(false);
  const [galleryFileIds, setGalleryFileIds] = useState<string[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<{ id: string; url: string }[]>([]);
  const imageEditRef = useRef<ImageEditHandle>(null);

  const { data: categories } = api.projectCategory.list.useQuery({
    page: 1,
    limit: 100,
  });
  const createMutation = api.project.create.useMutation({
    onSuccess: (data) => {
      void utils.project.list.invalidate();
      router.push(`/admin-panel/projects/${data.id}`);
    },
  });
  const uploadImageMutation = api.file.uploadImage.useMutation();

  useEffect(() => {
    if (name && !slug) {
      setSlug(slugify(name));
    }
  }, [name, slug]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setName(v);
    setSlug(slugify(v));
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreviewSrc(reader.result as string);
      setCoverBase64(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = useCallback((base64: string, mimeType: string) => {
    setCoverBase64(base64);
    setCoverMime(mimeType);
  }, []);

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const { fileId } = await uploadImageMutation.mutateAsync({
            imageBase64: base64,
            imageMimeType: file.type,
          });
          setGalleryFileIds((prev) => [...prev, fileId]);
          setGalleryPreviews((prev) => [...prev, { id: fileId, url: `/api/files/${fileId}/view` }]);
        } catch {
          // ignore
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const removeGalleryImage = (id: string) => {
    setGalleryFileIds((prev) => prev.filter((f) => f !== id));
    setGalleryPreviews((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageBase64 = coverBase64;
    let imageMimeType = coverMime;
    if (!imageBase64 && imageEditRef.current) {
      const result = await imageEditRef.current.getCroppedImage();
      if (result) {
        imageBase64 = result.base64;
        imageMimeType = result.mimeType;
      }
    }
    if (!imageBase64) {
      return; // canSubmit requires coverPreviewSrc, so getCroppedImage should have worked
    }
    createMutation.mutate({
      name,
      slug,
      shortDescription: shortDescription || undefined,
      imageBase64,
      imageMimeType,
      content,
      categoryId,
      isPublished,
      order,
      projectImageIds: galleryFileIds.length ? galleryFileIds : undefined,
    });
  };

  const canSubmit =
    name.trim() &&
    slug.trim() &&
    categoryId &&
    (content ?? "").trim() &&
    (Boolean(coverPreviewSrc) || Boolean(coverBase64));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin-panel/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Yeni Proje</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Ad</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="shortDescription">Kısa Açıklama</Label>
          <Input
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Liste özeti"
            disabled={createMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Kategori</Label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            disabled={createMutation.isPending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Seçin</option>
            {categories?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Kapak Görseli</Label>
          <Input type="file" accept="image/*" onChange={handleCoverFileChange} disabled={createMutation.isPending} />
          {coverPreviewSrc && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="freeCrop"
                  checked={freeCrop}
                  onCheckedChange={(c) => setFreeCrop(!!c)}
                  disabled={createMutation.isPending}
                />
                <Label htmlFor="freeCrop">Serbest kırpma (kenarlardan da kırpılabilir)</Label>
              </div>
              <ImageEdit
                ref={imageEditRef}
                src={coverPreviewSrc}
                aspectRatio={16 / 9}
                allowFreeCrop={freeCrop}
                maxWidth={1200}
                maxHeight={630}
                maxDisplayHeight={300}
                onCropComplete={handleCropComplete}
                disabled={createMutation.isPending}
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>İçerik</Label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Proje içeriği..."
            disabled={createMutation.isPending}
            onImageUpload={async (file) => {
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              const { fileId } = await uploadImageMutation.mutateAsync({
                imageBase64: base64,
                imageMimeType: file.type,
                prefix: "projects/content",
              });
              return `/api/files/${fileId}/view`;
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Galeri Görselleri</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryFileChange}
            disabled={createMutation.isPending}
          />
          {galleryPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {galleryPreviews.map((p) => (
                <div key={p.id} className="relative h-20 w-20">
                  <Image
                    src={p.url}
                    alt=""
                    width={80}
                    height={80}
                    className="rounded border object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(p.id)}
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isPublished"
              checked={isPublished}
              onCheckedChange={(c) => setIsPublished(!!c)}
              disabled={createMutation.isPending}
            />
            <Label htmlFor="isPublished">Yayında</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="order">Sıra</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              className="w-20"
              disabled={createMutation.isPending}
            />
          </div>
        </div>
        {createMutation.error && (
          <p className="text-sm text-destructive">{getErrorMessage(createMutation.error)}</p>
        )}
        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending || !canSubmit}>
            {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin-panel/projects">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
