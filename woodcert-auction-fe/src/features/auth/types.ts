import { z } from "zod";

const humanNameRegex = /^[\p{L}\s'.-]+$/u;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)\S+$/;
const vietnamesePhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email.")
    .email("Vui lòng nhập địa chỉ email hợp lệ.")
    .max(255, "Email không được vượt quá 255 ký tự."),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .max(255, "Mật khẩu không được vượt quá 255 ký tự."),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Họ và tên phải có từ 2 đến 100 ký tự.")
      .max(100, "Họ và tên phải có từ 2 đến 100 ký tự.")
      .regex(humanNameRegex, "Họ và tên chứa ký tự không hợp lệ."),
    email: z
      .string()
      .min(1, "Vui lòng nhập email.")
      .email("Vui lòng nhập địa chỉ email hợp lệ.")
      .max(255, "Email không được vượt quá 255 ký tự."),
    phoneNumber: z
      .string()
      .min(1, "Vui lòng nhập số điện thoại.")
      .max(20, "Số điện thoại không được vượt quá 20 ký tự.")
      .regex(vietnamesePhoneRegex, "Vui lòng nhập số điện thoại Việt Nam hợp lệ."),
    password: z
      .string()
      .min(8, "Mật khẩu phải có từ 8 đến 72 ký tự.")
      .max(72, "Mật khẩu phải có từ 8 đến 72 ký tự.")
      .regex(
        passwordRegex,
        "Mật khẩu phải chứa ít nhất một chữ cái, một chữ số và không có khoảng trắng.",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type RegisterCredentials = z.infer<typeof registerSchema>;

export interface LoginResponse {
  accessToken: string;
  roles?: string[];
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email.")
    .email("Vui lòng nhập địa chỉ email hợp lệ.")
    .max(255, "Email không được vượt quá 255 ký tự."),
});

export type ForgotPasswordCredentials = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mật khẩu phải có từ 8 đến 72 ký tự.")
      .max(72, "Mật khẩu phải có từ 8 đến 72 ký tự.")
      .regex(
        passwordRegex,
        "Mật khẩu phải chứa ít nhất một chữ cái, một chữ số và không có khoảng trắng.",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type ResetPasswordCredentials = z.infer<typeof resetPasswordSchema>;
