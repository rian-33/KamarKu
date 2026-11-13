import { toast } from 'react-hot-toast';
import type { ReactNode } from 'react';

export const toastSuccess = (message: string) => toast.success(message);
export const toastError = (message: string) => toast.error(message);
export const toastInfo = (message: string) => toast(message);
export const toastCustom = (content: ReactNode) => toast.custom(() => content);
