export const parsePay = (val) => {
  if (val === undefined || val === null) return null;
  const cleaned = String(val).replace(/[,]/g, '').trim();
  const match = cleaned.match(/([0-9.]+)/);
  if (match) {
    let num = parseFloat(match[1]);
    if (/lakh|l/i.test(cleaned)) {
      num = num * 100000;
    } else if (/k/i.test(cleaned)) {
      num = num * 1000;
    }
    return num;
  }
  return null;
};

export const parseNoticePeriod = (val) => {
  if (val === undefined || val === null) return null;
  const cleaned = String(val).toLowerCase().trim();
  const match = cleaned.match(/([0-9]+)/);
  if (match) {
    let days = parseInt(match[1], 10);
    if (cleaned.includes('month')) {
      days = days * 30;
    }
    return days;
  }
  if (cleaned.includes('immediate') || cleaned.includes('now') || cleaned.includes('0')) {
    return 0;
  }
  return null;
};

export default {
  parsePay,
  parseNoticePeriod
};
