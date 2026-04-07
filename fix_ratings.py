import re

with open('kutuphane/kutuphane.js', 'r') as f:
    content = f.read()

# 1. Add formatRating function
format_rating_func = """function normalizeStr(str) { return str ? str.toString().trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR') : ""; }

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
"""
content = content.replace('function normalizeStr(str) { return str ? str.toString().trim().replace(/\\s+/g, \' \').toLocaleLowerCase(\'tr-TR\') : ""; }', format_rating_func)

# 2. Fix renderBookManager
content = re.sub(
    r'let stats = bookStatsMap\[key\] \|\| { readCount: 0, reviewCount: 0, totalRating: 0, ratingCount: 0 };\s*let avgScore = stats\.ratingCount > 0 \? \(stats\.totalRating / stats\.ratingCount\)\.toFixed\(1\) : 0;\s*if \(avgScore && avgScore\.toString\(\)\.endsWith\(\'\.0\'\)\) {\s*avgScore = parseInt\(avgScore\);\s*} else if \(avgScore\) {\s*avgScore = parseFloat\(avgScore\);\s*}',
    r'let stats = bookStatsMap[key] || { readCount: 0, reviewCount: 0, totalRating: 0, ratingCount: 0 };\n        let rawAvg = stats.ratingCount > 0 ? (stats.totalRating / stats.ratingCount) : 0;\n        let avgScore = formatRating(rawAvg);',
    content
)

content = content.replace('let ratingHtml = item.avgScore > 0 ? ` <span style="color:#f59e0b; font-size:0.85rem;">⭐${item.avgScore.toFixed(1)}</span>` : "";',
                          'let ratingHtml = item.avgScore != 0 ? ` <span style="color:#f59e0b; font-size:0.85rem;">⭐${item.avgScore}</span>` : "";')

# 3. Fix populateDatalists
populate_old = """    books.sort().forEach(b => {
        let key = normalizeStr(b);
        let stats = bookStatsMap[key];
        let avgScore = (stats && stats.ratingCount > 0) ? (stats.totalRating / stats.ratingCount).toFixed(1) : 0;
        if (avgScore && avgScore.toString().endsWith('.0')) {
            avgScore = parseInt(avgScore);
        }
        let ratingStr = avgScore > 0 ? `⭐ ${avgScore} - ` : "";"""

populate_new = """    books.sort().forEach(b => {
        let key = normalizeStr(b);
        let stats = bookStatsMap[key];
        let rawAvg = (stats && stats.ratingCount > 0) ? (stats.totalRating / stats.ratingCount) : 0;
        let avgScore = formatRating(rawAvg);
        let ratingStr = avgScore != 0 ? `⭐ ${avgScore} - ` : "";"""

content = content.replace(populate_old, populate_new)

with open('kutuphane/kutuphane.js', 'w') as f:
    f.write(content)
