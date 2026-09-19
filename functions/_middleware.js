// 修复 Cloudflare Pages 强制去除 .html 后缀的 308 重定向：
// 拦截 .html 请求，内部请求无后缀路径拿到内容后以 200 原样返回。
// 解决百度站长验证/收录时 308 导致的失败。
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname.endsWith('.html')) {
    url.pathname = url.pathname.slice(0, -5);
    const newRequest = new Request(url.toString(), context.request);
    try {
      const res = await fetch(newRequest);
      if (res.status === 200) {
        return new Response(res.body, {
          status: 200,
          headers: res.headers,
        });
      }
    } catch (e) {
      // 内部取值失败则走默认流程
    }
  }
  return context.next();
}
