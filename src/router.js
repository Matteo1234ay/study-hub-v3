export function parseRoute(hash = "#/home") {
  const [path, queryString = ""] = hash.split("?");
  const query = new URLSearchParams(queryString);
  const lessonView = query.get("view") === "full" ? "full" : null;
  const lessonSection = query.get("section") || null;
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
  if (parts[0] === "paths" && parts[2] === "assessment" && parts.length === 3) {
    return { name: "path-assessment", params: { pathId: parts[1] } };
  }
  if (parts[0] === "paths" && parts[2] === "final-exam" && parts.length === 3) {
    return { name: "path-final-exam", params: { pathId: parts[1] } };
  }
  if (parts[0] === "lessons" && parts.length === 2) {
    return { name: "lesson", params: { lessonId: parts[1], ...(lessonView ? { view: lessonView } : {}) } };
  }
  if (parts[0] === "lessons" && parts[2] === "assessment" && parts.length === 3) {
    return { name: "assessment", params: { lessonId: parts[1] } };
  }
  if (parts[0] === "lessons" && parts[2] === "assessment" && parts.length === 4) {
    return { name: "chapter-assessment", params: { lessonId: parts[1], chapterId: parts[3] } };
  }
  if (parts[0] === "lessons" && parts.length === 3) {
    return { name: "chapter", params: {
      lessonId: parts[1], chapterId: parts[2],
      ...(lessonView ? { view: lessonView } : {}),
      ...(lessonSection ? { sectionId: lessonSection } : {})
    } };
  }
  if (parts[0] === "progress" && parts.length === 1) {
    return { name: "progress", params: {} };
  }
  if (parts[0] === "search" && parts.length === 1) {
    return { name: "search", params: { query: query.get("q") ?? "" } };
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

export function navigateToHash(href) {
  if (typeof href !== "string" || !href.startsWith("#/")) return false;
  location.hash = href.slice(1);
  return true;
}
