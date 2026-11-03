import { NextResponse } from "next/server";
import { balanceStore } from "@/lib/content/balanceFiles";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    const store = balanceStore();
    return NextResponse.json(
      id === null
        ? { visualizations: await store.list() }
        : { yaml: await store.read(id) },
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      {
        status: (error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 400,
      },
    );
  }
}
export async function PUT(request: Request) {
  try {
    const { yaml, overwrite } = await request.json();
    if (overwrite !== undefined && typeof overwrite !== "boolean")
      throw new Error("overwrite must be boolean");
    const id = await balanceStore().save(yaml, overwrite === true);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      {
        status: (error as NodeJS.ErrnoException).code === "EEXIST" ? 409 : 400,
      },
    );
  }
}
