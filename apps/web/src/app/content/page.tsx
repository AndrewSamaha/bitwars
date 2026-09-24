import { redirect } from "next/navigation";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ drawToScale?: string }> }) {
  const { drawToScale } = await searchParams;
  redirect(`/content/entities${drawToScale === "1" || drawToScale === "0" ? `?drawToScale=${drawToScale}` : ""}`);
}
