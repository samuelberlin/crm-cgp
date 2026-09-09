import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { isInlinePreviewable } from "@/features/documents/schemas";

function contentDisposition(disposition: "inline" | "attachment", filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id, tenantId: session.user.tenantId, contact: contactWhere(session.user) },
  });
  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  const forceDownload = request.nextUrl.searchParams.get("download") === "1";
  const disposition = !forceDownload && isInlinePreviewable(document.mimeType) ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(document.data), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": contentDisposition(disposition, document.name),
      "Content-Length": String(document.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
