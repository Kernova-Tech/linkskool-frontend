/** Keeps search engines off a page that is only for those given its link. */
export function useNoIndex() {
  let meta: HTMLMetaElement | null = null;
  const title = document.title;
  return {
    add() {
      meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex, nofollow";
      document.head.appendChild(meta);
    },
    remove() {
      meta?.remove();
      document.title = title;
    },
  };
}
