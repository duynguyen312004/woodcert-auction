/**
 * API upload ảnh sản phẩm cho seller.
 *
 * Thực hiện flow 3 bước: xin intent từ BE, upload lên Cloudinary (dùng
 * shared/lib/cloudinaryUpload), rồi confirm lại với BE bằng asset_id.
 * Endpoint dùng quyền CREATE_PRODUCT — chỉ seller mới gọi được.
 */
import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import { uploadToCloudinary, type CloudinaryUploadIntentRes } from "@/shared/lib/cloudinaryUpload";

type GetUploadIntentReq = {
  originalFileName: string;
  contentType: string;
  fileSize: number;
};

type ConfirmUploadReq = {
  mediaId: number;
  assetId: string;
};

/**
 * Xin signed upload intent từ BE cho ảnh sản phẩm.
 * BE tạo MediaAsset record và trả về các params để upload thẳng lên Cloudinary.
 */
async function getProductUploadIntent(req: GetUploadIntentReq): Promise<CloudinaryUploadIntentRes> {
  const response = await apiClient.post<ApiResponse<CloudinaryUploadIntentRes>>(
    "/products/images/upload-intent",
    req,
  );
  return unwrapApiResponse(response);
}

/**
 * Confirm với BE rằng file đã upload thành công lên Cloudinary.
 * assetId = asset_id lấy từ Cloudinary response (không phải public_id).
 */
async function confirmProductUpload(req: ConfirmUploadReq): Promise<void> {
  await apiClient.put("/products/images/confirm", req);
}

/**
 * Upload một file ảnh sản phẩm qua full 3-step flow.
 * Trả về mediaId để dùng trong CreateProductReq.images[].
 */
export async function uploadProductImage(file: File): Promise<number> {
  const intent = await getProductUploadIntent({
    originalFileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  const assetId = await uploadToCloudinary(intent, file);

  await confirmProductUpload({ mediaId: intent.mediaId, assetId });

  return intent.mediaId;
}
