const formatPrice = (n) => { 
  return n == null ? '' : new Intl.NumberFormat('vi-VN').format(Number(n)); 
}
const formatDate = (v) => {
  if (!v && v !== 0) return '';
  const s = String(v);
  // handle ISO datetimes and space-separated datetimes
  if (s.includes('T') || s.includes(' ')) return s.split(/[T ]/)[0];
  return s;
};
export {formatDate, formatPrice}