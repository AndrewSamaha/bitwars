import { NextResponse } from "next/server";
import { getSuggestedLoginDetails } from "@/features/users/server-functions/getSuggestedLogin";



export async function GET() {
  const suggestedLoginDetails = await getSuggestedLoginDetails();
  return NextResponse.json({ suggestedLoginDetails }, { status: 200 });
}
