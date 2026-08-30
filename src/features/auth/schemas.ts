import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください。"),
  password: z.string().min(1, "パスワードを入力してください。"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください。"),
  email: z.string().email("有効なメールアドレスを入力してください。"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
});
