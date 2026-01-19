const formatPrice = (n) => { 
  return n == null ? '' : new Intl.NumberFormat('vi-VN').format(Number(n)); 
}
const formatDate = (v) => {
  if (!v && v !== 0) return '';
  const s = String(v);
  // handle ISO datetimes and space-separated datetimes
  let dateStr = s.includes('T') || s.includes(' ') ? s.split(/[T ]/)[0] : s;
  
  // Parse and reformat to dd-mm-yyyy
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return dateStr;
};

const formatRate = (v) =>{
  if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    // show integer when whole number, otherwise trim trailing zeros
    const s = Number.isInteger(n) ? String(n) : String(n).replace(/\.0+$/,'');
    return `${s}%`;
}

export {formatDate, formatPrice, formatRate}