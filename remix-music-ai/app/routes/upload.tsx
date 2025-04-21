import { Form, useNavigation } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/node";
import { useState } from "react";
import { redirect } from "@remix-run/node";
import db from "~/utils/db.server";

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const songs: { artist: string; title: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const artist = form.get(`songs[${i}].artist`)?.toString().trim();
    const title = form.get(`songs[${i}].title`)?.toString().trim();
    if (artist && title) {
      songs.push({ artist, title });
    }
  }

  if (songs.length === 0) {
    throw new Error("최소 1곡 이상 입력해주세요.");
  }
  if (songs.length > 20) {
    throw new Error("최대 20곡까지만 입력할 수 있습니다.");
  }

  const playlist = await db.playlist.create({
    data: {
      songs: {
        create: songs.map((s, idx) => ({
          artist: s.artist,
          title: s.title,
          order: idx + 1,
        })),
      },
    },
    include: { songs: true },
  });

  return redirect(`/recommendations?id=${playlist.id}`);
};

export default function Upload() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [count, setCount] = useState(1);

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">🎧 플레이리스트 입력</h1>
      <Form method="post" className="space-y-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex space-x-2">
            <input
              name={`songs[${idx}].artist`}
              type="text"
              required
              placeholder="가수명"
              className="flex-1 border p-2 rounded"
            />
            <input
              name={`songs[${idx}].title`}
              type="text"
              required
              placeholder="곡명"
              className="flex-1 border p-2 rounded"
            />
          </div>
        ))}

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setCount((c) => Math.min(20, c + 1))}
            disabled={count >= 20}
            className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            항목 추가 ({count}/20)
          </button>
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            disabled={count <= 1}
            className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            항목 제거
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {isSubmitting ? "저장 중…" : "저장 후 추천받기"}
        </button>
      </Form>
    </div>
  );
}
