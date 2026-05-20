export const API_ERROR_MESSAGES: Record<string, string> = {
  // Network and general system errors
  "Network Error": "Lỗi kết nối mạng. Vui lòng thử lại.",
  "Internal Server Error": "Lỗi hệ thống. Vui lòng thử lại sau.",
  "Unexpected API error": "Đã có lỗi xảy ra. Vui lòng thử lại.",
  "Validation failed": "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  "Invalid request": "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại.",

  // Auth and authorization
  Unauthorized: "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.",
  "Access denied": "Bạn không có quyền thực hiện thao tác này.",
  "Invalid email or password": "Email hoặc mật khẩu không chính xác.",
  "Account is banned": "Tài khoản của bạn đã bị khóa.",
  "Account is not verified": "Tài khoản chưa được xác thực email.",
  "Email already exists": "Email này đã được sử dụng.",
  "Phone number already exists": "Số điện thoại này đã được sử dụng.",
  "Email verification token is invalid": "Mã xác nhận email không hợp lệ.",
  "Email verification token has expired": "Mã xác nhận email đã hết hạn.",
  "Email is already verified": "Email này đã được xác thực từ trước.",
  "Please wait before requesting another verification email":
    "Vui lòng đợi một lát trước khi yêu cầu gửi lại email xác nhận.",
  "No refresh token provided": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "Token has expired": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "Token is invalid": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",

  // Backend validation messages for login, register, and verification resend
  "Email is required": "Vui lòng nhập email.",
  "Invalid email format": "Vui lòng nhập địa chỉ email hợp lệ.",
  "Email must not exceed 255 characters": "Email không được vượt quá 255 ký tự.",
  "Password is required": "Vui lòng nhập mật khẩu.",
  "Password must not exceed 255 characters": "Mật khẩu không được vượt quá 255 ký tự.",
  "Password must be between 8 and 72 characters": "Mật khẩu phải có từ 8 đến 72 ký tự.",
  "Password must contain at least one letter, one digit, and no spaces":
    "Mật khẩu phải chứa ít nhất một chữ cái, một chữ số và không có khoảng trắng.",
  "Full name is required": "Vui lòng nhập họ và tên.",
  "Full name must be between 2 and 100 characters": "Họ và tên phải có từ 2 đến 100 ký tự.",
  "Full name contains invalid characters": "Họ và tên chứa ký tự không hợp lệ.",
  "Phone number is required": "Vui lòng nhập số điện thoại.",
  "Phone number must not exceed 20 characters": "Số điện thoại không được vượt quá 20 ký tự.",
  "Phone number must be a valid Vietnamese phone number":
    "Vui lòng nhập số điện thoại Việt Nam hợp lệ.",

  // Misconfiguration surfaced by register endpoint
  "Default role ROLE_BIDDER not found":
    "Hệ thống chưa cấu hình vai trò mặc định. Vui lòng thử lại sau.",
};
