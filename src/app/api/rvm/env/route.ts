export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
export async function OPTIONS() { return new Response(null, { status: 204, headers: cors() }); }

export async function GET() {
  const hasReplicate = !!process.env.REPLICATE_API_TOKEN;
  const hasReplicateToken = !!process.env.REPLICATE_TOKEN;
  const hasNextPublic = !!process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN;
  const env = process.env.VERCEL_ENV || "unknown";
  const branch = process.env.VERCEL_GIT_COMMIT_REF || "unknown";
  return new Response(
    JSON.stringify({ ok: true, env, branch, hasReplicate, hasReplicateToken, hasNextPublic }),
    { status: 200, headers: { "Content-Type": "application/json", ...cors() } }
  );
}
