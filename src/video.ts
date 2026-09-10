export type Video = { id: string; url: string; isShort: boolean };

export function parseVideo(input: string): Video | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.port || url.username || url.password) {
      return null;
    }
    if (
      !["www.youtube.com", "youtube.com", "m.youtube.com"].includes(
        url.hostname,
      )
    ) {
      return null;
    }
    const short = /^\/shorts\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname);
    const id =
      url.pathname === "/watch" ? url.searchParams.get("v") : short?.[1];
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return {
      id,
      url: `https://www.youtube.com/watch?v=${id}`,
      isShort: Boolean(short),
    };
  } catch {
    return null;
  }
}
