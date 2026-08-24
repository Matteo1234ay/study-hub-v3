export function parseRoute(hash = "#/home") {
  const [path, queryString = ""] = hash.split("?");
  const parts = path.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0 || (parts[0] === "home" && parts.length === 1)) {
    return { name: "home", params: {} };
  }
  if (parts[0] === "paths" && parts.length === 1) {
    return { name: "paths", params: {} };
  }
  if (parts[0] === "paths" && parts.length === 2) {
    return { name: "path", params: { pathId: parts[1] } };
  }
  if (parts[0] === "lessons" && parts.length === 2) {
    return { name: "lesson", params: { lessonId: parts[1] } };
  }
  if (parts[0] === "lessons" && parts.length === 3) {
    return { name: "chapter", params: { lessonId: parts[1], chapterId: parts[2] } };
  }
  if (parts[0] === "progress" && parts.length === 1) {
    return { name: "progress", params: {} };
  }
  if (parts[0] === "search" && parts.length === 1) {
    return { name: "search", params: { query: new URLSearchParams(queryString).get("q") ?? "" } };
  }
  if (parts[0] === "review" && parts.length === 1) {
    return { name: "review", params: {} };
  }
  return { name: "not-found", params: {} };
}

export function startRouter(onRoute) {
  const dispatch = () => onRoute(parseRoute(location.hash));
  addEventListener("hashchange", dispatch);
  dispatch();
  return () => removeEventListener("hashchange", dispatch);
}
