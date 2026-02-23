"use client";

import { useState } from "react";

import { api } from "@/lib/trpc/react";

export function LatestPost() {
  const [data] = api.post.list.useSuspenseQuery({
    limit: 1,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const latestPost = data.items[0];

  const utils = api.useUtils();

  // Zorunlu alanlar
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [imageId, setImageId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();

      // formu sıfırla
      setName("");
      setContent("");
      setImageId("");
      setCategoryId("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate">Your most recent post: {latestPost.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();

          createPost.mutate({
            name,
            content,
            imageId,
            categoryId,
          });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Image ID (UUID)"
          value={imageId}
          onChange={(e) => setImageId(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Category ID (UUID)"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />

        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}