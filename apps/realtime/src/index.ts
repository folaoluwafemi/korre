const worker = {
  fetch(request: Request): Response {
    const { pathname } = new URL(request.url);

    if (pathname === "/health") {
      return Response.json({ status: "ok", service: "realtime" });
    }

    return new Response("Not found", { status: 404 });
  },
};

export default worker;
