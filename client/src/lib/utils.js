import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const isMobileDevice = () => {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
};
