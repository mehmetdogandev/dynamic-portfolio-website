import { NextResponse } from "next/server";
import { getFileRecord, getFile } from "@/lib/minios3/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "File ID required" }, { status: 400 });
  }
  try {
    const record = await getFileRecord(id);
    if (!record) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const buffer = await getFile(record.fileName, record.bucket);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": record.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(record.originalName)}"`,
      },
    });
  } catch (error) {
    console.error("[files/view]", error);
    return NextResponse.json(
      { error: "Failed to load file" },
      { status: 500 }
    );
  }
}
