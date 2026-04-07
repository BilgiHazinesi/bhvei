const { execSync } = require('child_process');

// Dummy function to test output format
function formatRating(score) {
    if (!score) return 0;
    let num = parseFloat(score);
    if (isNaN(num)) return 0;
    let formatted = num.toFixed(1);
    if (formatted.endsWith('.0')) {
        return parseInt(formatted).toString();
    }
    return formatted.replace('.', ',');
}

console.log("5 ->", formatRating(5));
console.log("4.33333 ->", formatRating(4.33333));
console.log("3.5 ->", formatRating(3.5));
console.log("0 ->", formatRating(0));
