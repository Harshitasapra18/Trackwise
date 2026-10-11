// Grade is calculated from the percentage so mentors never type it by hand.
const calculateGrade = (obtained, max) => {
  const pct = max > 0 ? (obtained / max) * 100 : 0;
  if (pct >= 90) return "O";
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "B+";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  return "F";
};

module.exports = { calculateGrade };
