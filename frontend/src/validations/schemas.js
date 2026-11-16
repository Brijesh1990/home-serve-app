import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export const customerRegisterSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number is too long'),
    city: z.string().min(2, 'Please select your city'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const providerRegisterSchema = z
  .object({
    full_name: z.string().min(2, 'Owner full name is required'),
    business_name: z.string().min(3, 'Business name must be at least 3 characters'),
    email: z.string().email('Please enter a valid business email'),
    phone: z.string().min(10, 'Valid 10-digit phone number is required'),
    category: z.string().min(1, 'Please select primary service specialization'),
    city: z.string().min(2, 'Please select primary operating city'),
    experience_years: z.coerce.number().min(1, 'Minimum 1 year experience required').max(50),
    license_number: z.string().min(5, 'Valid business/GST/trade license number is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const bookingSchema = z.object({
  service_id: z.coerce.number().min(1, 'Please select a service'),
  provider_id: z.coerce.number().min(1, 'Please select a verified service provider'),
  scheduled_date: z.string().min(1, 'Please choose an appointment date'),
  time_slot: z.string().min(1, 'Please choose a preferred time slot'),
  address_line: z.string().min(5, 'Complete house/flat & street address is required'),
  city: z.string().min(2, 'City is required'),
  postal_code: z.string().min(5, 'Valid 6-digit PIN code is required'),
  problem_description: z
    .string()
    .min(10, 'Please describe the issue or requirement (min 10 chars)'),
  reference_image_url: z.string().optional().or(z.literal('')),
  coupon_code: z.string().optional().or(z.literal('')),
  payment_method: z.enum(['razorpay', 'pay_after_service']),
});

export const serviceSchema = z.object({
  name: z.string().min(3, 'Service title must be at least 3 characters'),
  category_id: z.coerce.number().min(1, 'Category is required'),
  base_price: z.coerce.number().min(99, 'Base price must be at least ₹99'),
  duration_minutes: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  inclusions: z.string().optional(),
  exclusions: z.string().optional(),
});

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .transform((v) => v.toUpperCase()),
  discount_type: z.enum(['percentage', 'flat']),
  discount_value: z.coerce.number().min(1, 'Discount value must be greater than 0'),
  min_order_amount: z.coerce.number().min(0, 'Minimum order value must be 0 or higher'),
  max_discount: z.coerce.number().min(0).optional(),
  valid_until: z.string().min(1, 'Expiry date is required'),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1, 'Please select a star rating').max(5),
  comment: z.string().min(10, 'Please write at least 10 characters in your review'),
});

export const complaintSchema = z.object({
  booking_id: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  priority: z.enum(['Low', 'Medium', 'High']),
  description: z.string().min(15, 'Please provide full details (at least 15 characters)'),
});
