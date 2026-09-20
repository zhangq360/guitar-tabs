/* =========================================================
 * functions/_middleware.js — Cloudflare Pages 中间件
 *
 * 职责（按执行顺序）：
 *   0) 主机名归一：www.guitar-tab.cn / guitar-tabs.pages.dev → guitar-tab.cn
 *   1) .html 兼容：内部请求无后缀路径，原样 200 返回（修复 CF 强制 308）
 *
 * 背景：实测三个主机名（apex / www / *.pages.dev）对同一套页面全部返回 200，
 * 没有任何一个做跳转。同一内容多域名可访问 = 重复内容信号，
 * 权重会被摊薄，且 canonical 指向 pages.dev 时搜索引擎会把归属判给旧域名。
 * 本文件把这个问题在边缘层一次收干净。
 * ========================================================= */

/* ---------- 配置：只改这里 ---------- */

/** 唯一的正式域名。全站所有其他主机名都 301 到这个域名。 */
const CANONICAL_HOST = "guitar-tab.cn";

/**
 * 需要被 301 收拢的主机名（精确匹配）。
 * 想保留某个主机名独立可访问，把对应那行删掉或注释掉即可。
 */
const CONSOLIDATE_HOSTS = [
  "www.guitar-tab.cn",
  "guitar-tabs.pages.dev",
];

/**
 * 是否把 Preview 部署的子域也一并收拢（形如 main.guitar-tabs.pages.dev）。
 * 默认 false —— 保留它你才能在合并前预览分支效果。
 * 如果你从不使用 Preview 部署，改成 true 可以让搜索引擎彻底看不到 pages.dev。
 */
const CONSOLIDATE_PREVIEW = false;

/** Preview 子域的尾缀，配合 CONSOLIDATE_PREVIEW 使用 */
const PREVIEW_SUFFIX = ".guitar-tabs.pages.dev";

/* ---------- 逻辑 ---------- */

function shouldConsolidate(hostname) {
  const h = String(hostname).toLowerCase();
  if (h === CANONICAL_HOST) return false;           /* 已在正式域名，不跳，避免死循环 */
  if (CONSOLIDATE_HOSTS.indexOf(h) >= 0) return true;
  if (CONSOLIDATE_PREVIEW && h.endsWith(PREVIEW_SUFFIX)) return true;
  return false;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  /* --- 0) 主机名归一：301 到正式域名，路径与查询串原样保留 --- */
  if (shouldConsolidate(url.hostname)) {
    const target = "https://" + CANONICAL_HOST + url.pathname + url.search;
    /* 301 = 永久重定向，搜索引擎据此转移权重 */
    return Response.redirect(target, 301);
  }

  /* --- 1) .html 兼容：拦截 .html 请求，内部换成无后缀路径取内容，以 200 返回 ---
     Cloudflare Pages 默认把 /x.html 308 跳到 /x，会让百度站长验证与收录失败。
     注意：这一段必须在主机名归一之后，否则 pages.dev 上的 .html 请求
     会在跳转前被这个分支吃掉，导致跳转不发生。 */
  if (url.pathname.endsWith(".html")) {
    url.pathname = url.pathname.slice(0, -5);
    const newRequest = new Request(url.toString(), context.request);
    try {
      /* redirect:'manual' 不跟随跳转：无后缀资源真实存在时 Pages 直接 200；
         不存在时是 308/404，落到下面走默认流程返回 404，避免软 404（把首页内容
         当 200 返回给不存在的 URL，会被百度判定为软 404 站点，影响收录）。 */
      const res = await fetch(newRequest, { redirect: 'manual' });
      const ctype = res.headers.get('content-type') || '';
      if (res.status === 200 && ctype.includes('text/html')) {
        return new Response(res.body, {
          status: 200,
          headers: res.headers,
        });
      }
    } catch (e) {
      /* 内部取值失败则走默认流程 */
    }
  }

  return context.next();
}
