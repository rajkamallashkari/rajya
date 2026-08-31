import { createDirectUpload } from "@/features/media/api/http";
import { md5Base64 } from "@/features/media/model/checksum";
import { FALLBACK_STICKER_NAME, FALLBACK_STICKER_TYPE } from "@/features/media/model/constants";

export async function presignAndUpload(file: File): Promise<string> {
  const checksum = md5Base64(await new Response(file).arrayBuffer());
  const presign = await createDirectUpload({
    filename: file.name.trim() || FALLBACK_STICKER_NAME,
    byte_size: file.size,
    checksum,
    content_type: file.type || FALLBACK_STICKER_TYPE,
  });
  if (presign.skip_upload) {
    return presign.blob_signed_id;
  }
  if (!presign.direct_upload_url) {
    throw new Error("direct_upload_url_missing");
  }
  const uploaded = await fetch(presign.direct_upload_url, {
    method: "PUT",
    headers: presign.headers ?? {},
    body: file,
  });
  if (!uploaded.ok) {
    throw new Error("direct_upload_put_failed");
  }
  return presign.blob_signed_id;
}
