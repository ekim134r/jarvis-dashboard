import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { EDIT_ALLOWED_EXTENSIONS } from "@/lib/skills";

export async function GET() {
  return NextResponse.json({
    editAllowedExtensions: Array.from(EDIT_ALLOWED_EXTENSIONS).sort(),
  });
}
