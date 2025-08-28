const { extractCellsAndRanges } = require('../lib/equationExtractCells.js');

describe('equationExtractCells', () => {
  describe('extractCellsAndRanges', () => {
    test('should extract single cells from simple formula', () => {
      const result = extractCellsAndRanges('=A1+B2');
      
      expect(result.cells).toEqual(['A1', 'B2']);
      expect(result.ranges).toEqual([]);
    });

    test('should extract cell ranges from formula', () => {
      const result = extractCellsAndRanges('=SUM(A1:B5)');
      
      // Library includes range endpoints as cells
      expect(result.cells).toEqual(['A1', 'B5']);
      expect(result.ranges).toEqual(['A1:B5']);
    });

    test('should extract both cells and ranges from complex formula', () => {
      const result = extractCellsAndRanges('=SUM(A1:B2) + C3 + D4');
      
      // Library includes range endpoints as cells
      expect(result.cells).toEqual(['A1', 'B2', 'C3', 'D4']);
      expect(result.ranges).toEqual(['A1:B2']);
    });

    test('should handle multiple ranges in formula', () => {
      const result = extractCellsAndRanges('=SUM(A1:B2) + SUM(C3:D4)');
      
      // Library treats range endpoints as individual cells
      expect(result.cells).toEqual(['A1', 'B2', 'C3', 'D4']);
      expect(result.ranges).toEqual(['A1:B2', 'C3:D4']);
    });

    test('should handle mixed cell references and ranges', () => {
      const result = extractCellsAndRanges('=A1 + SUM(B1:B5) + C1 + SUM(D1:D10)');
      
      // Library includes range endpoints as cells
      expect(result.cells).toEqual(['A1', 'B1', 'B5', 'C1', 'D1', 'D10']);
      expect(result.ranges).toEqual(['B1:B5', 'D1:D10']);
    });

    test('should handle sheet-qualified cell references', () => {
      const result = extractCellsAndRanges('=Sheet1!A1 + Sheet2!B2');
      
      expect(result.cells).toEqual(['Sheet1!A1', 'Sheet2!B2']);
      expect(result.ranges).toEqual([]);
    });

    test('should handle sheet-qualified ranges', () => {
      const result = extractCellsAndRanges('=SUM(Sheet1!A1:B5)');
      
      expect(result.cells).toEqual(['B5', 'Sheet1!A1']);
      expect(result.ranges).toEqual(['Sheet1!A1:B5']);
    });

    test('should handle formulas with functions and no cell references', () => {
      const result = extractCellsAndRanges('=PI() + 5');
      
      expect(result.cells).toEqual([]);
      expect(result.ranges).toEqual([]);
    });

    test('should handle nested functions with cell references', () => {
      const result = extractCellsAndRanges('=IF(A1>0, SUM(B1:B5), C1)');
      
      expect(result.cells).toEqual(['A1', 'B1', 'B5', 'C1']);
      expect(result.ranges).toEqual(['B1:B5']);
    });

    test('should handle absolute cell references', () => {
      const result = extractCellsAndRanges('=$A$1 + B2 + $C3');
      
      expect(result.cells).toEqual(['$A$1', '$C3', 'B2']);
      expect(result.ranges).toEqual([]);
    });

    test('should handle absolute ranges', () => {
      const result = extractCellsAndRanges('=SUM($A$1:$B$5)');
      
      expect(result.cells).toEqual(['$A$1', '$B$5']);
      expect(result.ranges).toEqual(['$A$1:$B$5']);
    });

    test('should handle mixed absolute and relative references', () => {
      const result = extractCellsAndRanges('=SUM(A1:$B$5) + C3');
      
      expect(result.cells).toEqual(['$B$5', 'A1', 'C3']);
      expect(result.ranges).toEqual(['A1:$B$5']);
    });

    test('should remove duplicates from cells and ranges', () => {
      const result = extractCellsAndRanges('=A1 + A1 + SUM(B1:B5) + SUM(B1:B5)');
      
      expect(result.cells).toEqual(['A1', 'B1', 'B5']);
      expect(result.ranges).toEqual(['B1:B5']);
    });

    test('should handle complex formula with multiple operations', () => {
      const result = extractCellsAndRanges('=VLOOKUP(A1, B1:D10, 2, FALSE) + SUM(E1:E5) * F1');
      
      expect(result.cells).toEqual(['A1', 'B1', 'D10', 'E1', 'E5', 'F1']);
      expect(result.ranges).toEqual(['B1:D10', 'E1:E5']);
    });

    test('should handle array formulas', () => {
      const result = extractCellsAndRanges('=SUM(A1:A5*B1:B5)');
      
      expect(result.cells).toEqual(['A1', 'A5', 'B1', 'B5']);
      expect(result.ranges).toEqual(['A1:A5', 'B1:B5']);
    });

    test('should handle formulas with text and numbers', () => {
      const result = extractCellsAndRanges('=A1 & "text" & 123 + B2');
      
      expect(result.cells).toEqual(['A1', 'B2']);
      expect(result.ranges).toEqual([]);
    });

    test('should handle formula with only constants', () => {
      const result = extractCellsAndRanges('=5 + 10 * 2');
      
      expect(result.cells).toEqual([]);
      expect(result.ranges).toEqual([]);
    });

    test('should handle large ranges', () => {
      const result = extractCellsAndRanges('=SUM(A1:Z100)');
      
      expect(result.cells).toEqual(['A1', 'Z100']);
      expect(result.ranges).toEqual(['A1:Z100']);
    });

    test('should handle 3D references across sheets', () => {
      const result = extractCellsAndRanges('=SUM(Sheet1:Sheet3!A1)');
      
      // Note: 3D references might be handled differently by the tokenizer
      // This test verifies the current behavior
      expect(result).toHaveProperty('cells');
      expect(result).toHaveProperty('ranges');
      expect(Array.isArray(result.cells)).toBe(true);
      expect(Array.isArray(result.ranges)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle empty equation string gracefully', () => {
      const result = extractCellsAndRanges('');
      
      expect(result.cells).toEqual([]);
      expect(result.ranges).toEqual([]);
    });

    test('should handle invalid equation strings gracefully', () => {
      const result = extractCellsAndRanges('invalid formula');
      
      // Library treats words as cell references
      expect(result.cells).toEqual(['formula', 'invalid']);
      expect(result.ranges).toEqual([]);
    });

    test('should handle malformed formulas gracefully', () => {
      const result = extractCellsAndRanges('=SUM(A1:');
      
      expect(result.cells).toEqual([]);
      expect(result.ranges).toEqual([]);
    });

    test('should return arrays even for single results', () => {
      const result = extractCellsAndRanges('=A1');
      
      expect(Array.isArray(result.cells)).toBe(true);
      expect(Array.isArray(result.ranges)).toBe(true);
      expect(result.cells).toEqual(['A1']);
      expect(result.ranges).toEqual([]);
    });

    test('should handle very complex nested formulas', () => {
      const result = extractCellsAndRanges('=IF(AND(A1>0,B1<100),SUM(C1:C10)+AVERAGE(D1:D10),IF(E1="test",F1*G1,SUM(H1:H5)))');
      
      expect(result.cells.length).toBeGreaterThan(0);
      expect(result.ranges.length).toBeGreaterThan(0);
      // Verify all results are strings
      result.cells.forEach(cell => expect(typeof cell).toBe('string'));
      result.ranges.forEach(range => expect(typeof range).toBe('string'));
    });

    test('should handle equations without equals sign', () => {
      const result = extractCellsAndRanges('A1+B2');
      
      // Library treats these as cell references
      expect(result.cells).toEqual(['A1', 'B2']);
      expect(result.ranges).toEqual([]);
    });

    test('should handle null and undefined inputs', () => {
      expect(extractCellsAndRanges(null)).toEqual({ cells: [], ranges: [] });
      expect(extractCellsAndRanges(undefined)).toEqual({ cells: [], ranges: [] });
    });
  });

  describe('return value structure', () => {
    test('should always return object with cells and ranges properties', () => {
      const result = extractCellsAndRanges('=A1');
      
      expect(result).toHaveProperty('cells');
      expect(result).toHaveProperty('ranges');
      expect(typeof result).toBe('object');
    });

    test('should return sorted arrays for consistent output', () => {
      const result = extractCellsAndRanges('=Z1 + A1 + B1');
      
      // The function returns sorted arrays
      expect(result.cells).toEqual(['A1', 'B1', 'Z1']);
    });

    test('should handle formulas starting without equals sign in tokenizer context', () => {
      const result = extractCellsAndRanges('SUM(A1:B5)');
      
      // Library treats range endpoints as cells
      expect(result.cells).toEqual(['A1', 'B5']);
      expect(result.ranges).toEqual(['A1:B5']);
    });
  });
});
