/**
 * Tiện ích upload file lên Cloudinary theo signed upload flow.
 *
 * Dùng chung cho bất kỳ feature nào cần upload ảnh: seller (product images),
 * appraiser (proof images), v.v. Hàm này không biết endpoint nào — chỉ nhận
 * intent response từ BE và file, trả về asset_id để confirm lại với BE.
 */

export type CloudinaryUploadIntentRes = {
  mediaId: number;
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  assetFolder: string;
  publicId: string;
  resourceType: string;
  timestamp: number;
  signature: string;
};

/**
 * Upload file lên Cloudinary với signed params nhận từ BE.
 * Trả về asset_id — trường BE dùng để verify ownership khi confirm.
 * Lưu ý: asset_id khác public_id và secure_url từ Cloudinary response.
 */
export async function uploadToCloudinary(
  intent: CloudinaryUploadIntentRes,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", intent.apiKey);
  formData.append("timestamp", String(intent.timestamp));
  formData.append("signature", intent.signature);
  formData.append("asset_folder", intent.assetFolder);
  formData.append("public_id", intent.publicId);

  const response = await fetch(intent.uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Cloudinary upload thất bại: ${response.status} — ${errorText}`);
  }

  const data = (await response.json()) as { asset_id?: string };

  if (!data.asset_id) {
    throw new Error("Cloudinary response thiếu asset_id");
  }

  return data.asset_id;
}
