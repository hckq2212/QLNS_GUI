
  export default function formatPrice(n) { return n == null ? '' : new Intl.NumberFormat('vi-VN').format(Number(n)); }