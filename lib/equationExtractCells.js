const { tokenize } = require('excel-formula-tokenizer');
const { buildTree, visit } = require('excel-formula-ast');

/**
 * Extracts cells and ranges from Excel formula equation string
 * @param {string} equation - Excel formula equation (e.g., "=SUM(A1:B2) + C3")
 * @returns {Object} Object containing cells and ranges arrays
 */
function extractCellsAndRanges(equation) {
  try {
    // Tokenize the equation string
    const tokens = tokenize(equation);
    
    // Build AST from tokens
    const tree = buildTree(tokens);
    
    const cells = new Set(), ranges = new Set();
    visit(tree, {
      enterCell(n)      { cells.add(n.key); },
      enterCellRange(n) { ranges.add(`${n.left.key}:${n.right.key}`); }
    });
    
    return { cells: [...cells].sort(), ranges: [...ranges].sort() };
  } catch (error) {
    // Return empty arrays for invalid equations
    return { cells: [], ranges: [] };
  }
}

module.exports = { extractCellsAndRanges };
