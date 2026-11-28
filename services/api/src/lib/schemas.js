import { z } from 'zod';
import mongoose from 'mongoose';

// Reusable zod building blocks.
export const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), { message: 'ID không hợp lệ' });

export const email = z
  .string({ required_error: 'Vui lòng nhập email' })
  .trim()
  .toLowerCase()
  .max(120)
  .email('Email không hợp lệ');

export const password = z
  .string({ required_error: 'Vui lòng nhập mật khẩu' })
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(72, 'Mật khẩu tối đa 72 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu phải có chữ cái')
  .regex(/\d/, 'Mật khẩu phải có chữ số');

export const fullName = z
  .string({ required_error: 'Vui lòng nhập họ tên' })
  .trim()
  .min(2, 'Họ tên tối thiểu 2 ký tự')
  .max(100);

export const phone = z
  .string()
  .trim()
  .regex(/^(0|\+84)\d{9,10}$/, 'Số điện thoại không hợp lệ');

const requiredText = (msg, max = 200) => z.string({ required_error: msg }).trim().min(1, msg).max(max);

/** Shipping address. `phone` is optional on saved addresses, required at checkout. */
export const address = z.object({
  recipientName: requiredText('Vui lòng nhập tên người nhận', 100),
  phone: z
    .union([phone, z.literal('')])
    .optional()
    .default(''),
  street: requiredText('Vui lòng nhập số nhà, tên đường'),
  ward: z.string().trim().max(100).optional().default(''),
  district: requiredText('Vui lòng nhập quận/huyện', 100),
  city: requiredText('Vui lòng nhập tỉnh/thành phố', 100),
});

export const pageQuery = {
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};

export const trimmedSearch = z.string().trim().max(100).optional();
