// app/routes/recommendations.tsx
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import db from "~/utils/db.server";

type SongItem = {
  id: number;
  artist: string;
  title: string;
  order: number;
};

type LoaderData = {
  playlistId: number;
  songs: SongItem[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  if (!idParam) {
    throw new Response("id 파라미터가 필요합니다", { status: 400 });
  }

  const playlistId = parseInt(idParam, 10);
  if (isNaN(playlistId)) {
    throw new Response("유효한 id여야 합니다", { status: 400 });
  }

  const playlist = await db.playlist.findUnique({
    where: { id: playlistId },
    include: {
      songs: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!playlist) {
    throw new Response("해당 플레이리스트를 찾을 수 없습니다", { status: 404 });
  }

  return json<LoaderData>({
    playlistId,
    songs: playlist.songs.map((s) => ({
      id: s.id,
      artist: s.artist,
      title: s.title,
      order: s.order,
    })),
  });
};

export default function Recommendations() {
  const { playlistId, songs } = useLoaderData<LoaderData>();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">🎶 추천 결과</h1>
      <p className="mb-6 text-gray-600">
        플레이리스트 #{playlistId}에 저장된 곡 목록입니다.
      </p>

      <ul className="space-y-3">
        {songs.map((song) => (
          <li
            key={song.id}
            className="flex items-center p-4 bg-white shadow rounded"
          >
            <span className="text-lg font-semibold mr-4 text-gray-800">
              {song.order}.
            </span>
            <div>
              <div className="text-sm text-gray-500">{song.artist}</div>
              <div className="text-base font-medium text-blue-800">
                {song.title}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Link
        to="/upload"
        className="inline-block mt-8 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        다른 플레이리스트 입력하기
      </Link>
    </div>
  );
}
