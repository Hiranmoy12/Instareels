/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export interface Product {
  id: string;
  title: string;
  price: number;
  qrImage: string;
}

export interface ProductDetail extends Product {
  fampayId: string;
}

export interface PaymentSubmission {
  productId: string;
  name: string;
  transactionId: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  downloadToken?: string;
}

export interface DownloadResponse {
  error?: string;
  url?: string;
}
