# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 11 of 15: Formula Engine Complete Specification
## Version 5.0.0 | 2026-05-18

---

## 0. PURPOSE

This part specifies EVERY formula function FinPlan Pro must support.
Each function must produce IDENTICAL results to Excel when given
the same inputs. The FormulaEngine.ts AST parser evaluates these
functions on a dependency-sorted DAG of cells.

ENGINE: src/engines/FormulaEngine.ts
TESTS: src/engines/FormulaEngine.test.ts

---

## 1. FUNCTION CATEGORIES

  Math and Trig:    24 functions
  Logical:           8 functions
  Lookup and Ref:    8 functions
  Text:             14 functions
  Date and Time:    12 functions
  Financial:        15 functions
  Statistical:       8 functions
  Aggregate:         6 functions
  TOTAL:            95 functions

---

## 2. MATH AND TRIGONOMETRY FUNCTIONS

### SUM

  SYNTAX: SUM(number1, [number2], ...)
  CATEGORY: Math
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Adds all numbers in a range or list of arguments.

  PARAMETERS:
    number1: number or number[] — First number or range
    number2: number or number[] — Additional (optional, up to 255)

  RETURN: number

  PSEUDOCODE:
    function SUM(...args):
      flat = flatten(args)          // [[1,2],3] → [1,2,3]
      total = 0
      for each value in flat:
        if isError(value): return value
        if isNumber(value): total += value
        // text, booleans, empty cells ignored
      return total

  EXAMPLES:
    Example 1: SUM(1, 2, 3) = 6
    Example 2: SUM(A1:A3) where A1=10, A2="", A3=30 = 40
    Example 3: SUM(A1:A3) where A1=10, A2=#REF!, A3=30 = #REF!
    Example 4: SUM(0.1, 0.2) = 0.30000000000000004 (IEEE 754 — display rounds)
    Example 5: SUM(A1:A3) where A1="abc", A2=true, A3=10 = 10

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Known differences: None — algorithm is identical
    Test case: SUM({1,2,3,4,5}) should equal 15
    Test case: SUM({0.1,0.2,0.3}) should equal 0.6 (display, not binary)

  EDGE CASES:
    Empty cells — ignored (not treated as 0)
    Text in range — ignored
    Boolean in range — ignored (Excel treats as 0/1 in some contexts)
    Error in range — returns that error immediately
    All empty — returns 0
    Circular reference — FormulaEngine detects and returns #CIRCULAR!
    Overflow — IEEE 754 max ~1.8e308, returns #NUM! if exceeded

### SUMIF

  SYNTAX: SUMIF(range, criteria, [sum_range])
  CATEGORY: Math
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Sums cells in sum_range where corresponding cells in range meet criteria.
  If sum_range omitted, sums the range itself.

  PARAMETERS:
    range: any[] — Cells to evaluate against criteria
    criteria: string — Condition: ">10", "<=100", "<>0", "abc", "*text*", "?ab"
    sum_range: any[] — Cells to sum (optional, defaults to range)

  RETURN: number

  PSEUDOCODE:
    function SUMIF(range, criteria, sum_range = range):
      parsed = parseCriteria(criteria)  // {op: ">", value: 10} or {op: "contains", value: "abc"}
      total = 0
      for i = 0 to range.length - 1:
        if evaluateCriteria(range[i], parsed):
          if isNumber(sum_range[i]): total += sum_range[i]
      return total

    function parseCriteria(criteria):
      if criteria starts with ">=": return {op: ">=", value: parseNumber(rest)}
      if criteria starts with "<=": return {op: "<=", value: parseNumber(rest)}
      if criteria starts with "<>": return {op: "<>", value: parseNumber(rest)}
      if criteria starts with ">":  return {op: ">",  value: parseNumber(rest)}
      if criteria starts with "<":  return {op: "<",  value: parseNumber(rest)}
      if criteria starts with "=":  return {op: "=",  value: parseNumber(rest)}
      if criteria contains "*" or "?": return {op: "wildcard", value: criteria}
      return {op: "=", value: parseNumber(criteria)}

    function evaluateCriteria(cellValue, parsed):
      switch parsed.op:
        case ">":  return cellValue > parsed.value
        case "<":  return cellValue < parsed.value
        case ">=": return cellValue >= parsed.value
        case "<=": return cellValue <= parsed.value
        case "=":  return cellValue == parsed.value
        case "<>": return cellValue != parsed.value
        case "wildcard": return wildcardMatch(cellValue, parsed.value)

  EXAMPLES:
    Example 1: SUMIF(A1:A4, ">10") where A1=5, A2=15, A3=20, A4=8 = 35 (15+20)
    Example 2: SUMIF(A1:A4, "<>0", B1:B4) where A1=0,A2=1,A3=0,A4=1, B1=100,B2=200,B3=300,B4=400 = 600 (200+400)
    Example 3: SUMIF(A1:A3, "*Sales*") where A1="Total Sales", A2="Expenses", A3="Net Sales" = sums A1+A3 values

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Known differences: None
    Test case: SUMIF({5,15,20,8}, ">10") should equal 35

  EDGE CASES:
    Empty cells in range — evaluated as 0 for numeric criteria
    Text in sum_range — ignored
    No matches — returns 0
    Wildcards: * = any chars, ? = single char

### SUMIFS

  SYNTAX: SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2, ...])
  CATEGORY: Math
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Sums cells meeting ALL criteria (AND logic). Up to 127 criteria pairs.

  PARAMETERS:
    sum_range: any[] — Cells to sum
    criteria_range1: any[] — First range to evaluate
    criteria1: string — First condition
    criteria_rangeN, criteriaN: additional pairs (optional)

  RETURN: number

  PSEUDOCODE:
    function SUMIFS(sum_range, ...criteriaPairs):
      total = 0
      for i = 0 to sum_range.length - 1:
        allMatch = true
        for each (criteriaRange, criteria) in criteriaPairs:
          parsed = parseCriteria(criteria)
          if not evaluateCriteria(criteriaRange[i], parsed):
            allMatch = false
            break
        if allMatch and isNumber(sum_range[i]):
          total += sum_range[i]
      return total

  EXAMPLES:
    Example 1: SUMIFS(C1:C4, A1:A4, ">10", B1:B4, "<100")
      A1=5,B1=50,C1=100 → skip (A1 not >10)
      A2=15,B2=80,C2=200 → match → 200
      A3=20,B3=120,C3=300 → skip (B3 not <100)
      A4=25,B4=90,C4=400 → match → 400
      Result: 600

  EXCEL COMPATIBILITY:
    Matches Excel: Yes — Note: SUMIFS has sum_range FIRST (opposite of SUMIF)
    Test case: SUMIFS({100,200,300}, {5,15,20}, ">10") should equal 500

### AVERAGE

  SYNTAX: AVERAGE(number1, [number2], ...)
  CATEGORY: Statistical
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Arithmetic mean of numbers. Excludes text, empty cells, booleans.

  RETURN: number or #DIV/0! if no numeric values

  PSEUDOCODE:
    function AVERAGE(...args):
      flat = flatten(args)
      sum = 0, count = 0
      for each value in flat:
        if isNumber(value): sum += value; count++
      if count == 0: return #DIV/0!
      return sum / count

  EXAMPLES:
    Example 1: AVERAGE(10, 20, 30) = 20
    Example 2: AVERAGE(A1:A3) where A1=10, A2="", A3=30 = 20 (10+30)/2
    Example 3: AVERAGE(A1:A3) where A1="a", A2="b", A3="c" = #DIV/0!

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: AVERAGE({10,20,30,40,50}) should equal 30

  EDGE CASES:
    All empty/text — returns #DIV/0!
    Single value — returns that value
    Mixed text/numbers — ignores text

### AVERAGEIF / AVERAGEIFS

  SYNTAX: AVERAGEIF(range, criteria, [average_range])
         AVERAGEIFS(average_range, criteria_range1, criteria1, ...)
  DESCRIPTION: Average of cells meeting criteria. Same logic as SUMIF/SUMIFS.
  Returns #DIV/0! if no cells match.

### MIN / SYNTAX: MIN(number1, [number2], ...)

  DESCRIPTION: Smallest number in arguments. Ignores text, empty, booleans.
  PSEUDOCODE:
    function MIN(...args):
      flat = flatten(args)
      minVal = Infinity
      for each value in flat:
        if isNumber(value) and value < minVal: minVal = value
      if minVal == Infinity: return 0
      return minVal
  EXAMPLES:
    MIN(3, 1, 4, 1, 5) = 1
    MIN(A1:A3) where A1=5, A2="text", A3=2 = 2

### MAX

  SYNTAX: MAX(number1, [number2], ...)
  DESCRIPTION: Largest number. Same logic as MIN but finds maximum.
  EXAMPLES:
    MAX(3, 1, 4, 1, 5) = 5

### COUNT

  SYNTAX: COUNT(value1, [value2], ...)
  DESCRIPTION: Counts cells containing numbers. Dates are numbers.
  PSEUDOCODE:
    function COUNT(...args):
      flat = flatten(args)
      count = 0
      for each value in flat:
        if isNumber(value): count++
      return count
  EXAMPLES:
    COUNT(1, "two", 3, "", true) = 2 (only 1 and 3)

### COUNTA

  SYNTAX: COUNTA(value1, [value2], ...)
  DESCRIPTION: Counts non-empty cells (text, numbers, errors, booleans).
  EXAMPLES:
    COUNTA(1, "two", 3, "", true) = 4

### COUNTBLANK

  SYNTAX: COUNTBLANK(range)
  DESCRIPTION: Counts empty cells in a range.
  EXAMPLES:
    COUNTBLANK(A1:A5) where A1=1, A2="", A3=3, A4="", A5=5 = 2

### ABS

  SYNTAX: ABS(number)
  DESCRIPTION: Absolute value.
  EXAMPLES:
    ABS(-5) = 5, ABS(5) = 5, ABS(0) = 0

### ROUND

  SYNTAX: ROUND(number, num_digits)
  DESCRIPTION: Rounds number to specified decimal places.
  num_digits > 0: decimal places, = 0: integer, < 0: power of 10

  PSEUDOCODE:
    function ROUND(number, num_digits):
      if num_digits >= 0:
        factor = 10 ^ num_digits
        return Math.round(number * factor) / factor
      else:
        factor = 10 ^ (-num_digits)
        return Math.round(number / factor) * factor

  EXAMPLES:
    ROUND(3.456, 2) = 3.46
    ROUND(3.456, 0) = 3
    ROUND(3.456, -1) = 0
    ROUND(1234, -2) = 1200
    ROUND(2.5, 0) = 3 (rounds half up, matches Excel)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes — both use "round half up" (banker's rounding not used)
    Test case: ROUND(2.5, 0) should equal 3

### ROUNDUP / ROUNDDOWN

  SYNTAX: ROUNDUP(number, num_digits) / ROUNDDOWN(number, num_digits)
  DESCRIPTION: Always rounds away from / toward zero.
  EXAMPLES:
    ROUNDUP(3.1, 0) = 4, ROUNDDOWN(3.9, 0) = 3
    ROUNDUP(-3.1, 0) = -4, ROUNDDOWN(-3.9, 0) = -3

### MOD

  SYNTAX: MOD(number, divisor)
  DESCRIPTION: Remainder after division. Result has same sign as divisor.
  PSEUDOCODE:
    function MOD(number, divisor):
      return number - divisor * INT(number / divisor)
  EXAMPLES:
    MOD(10, 3) = 1
    MOD(-10, 3) = 2 (not -1 — matches Excel)
    MOD(10, -3) = -2

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: MOD(-10, 3) should equal 2

### INT

  SYNTAX: INT(number)
  DESCRIPTION: Rounds down to nearest integer (toward negative infinity).
  EXAMPLES:
    INT(3.7) = 3, INT(-3.7) = -4, INT(3) = 3

### CEILING

  SYNTAX: CEILING(number, significance)
  DESCRIPTION: Rounds up to nearest multiple of significance.
  EXAMPLES:
    CEILING(4.3, 1) = 5, CEILING(6.4, 0.5) = 6.5

### FLOOR

  SYNTAX: FLOOR(number, significance)
  DESCRIPTION: Rounds down to nearest multiple of significance.
  EXAMPLES:
    FLOOR(4.7, 1) = 4, FLOOR(6.4, 0.5) = 6.0

### POWER

  SYNTAX: POWER(base, exponent)
  DESCRIPTION: base raised to exponent.
  EXAMPLES:
    POWER(2, 10) = 1024, POWER(9, 0.5) = 3

### SQRT

  SYNTAX: SQRT(number)
  DESCRIPTION: Square root. Returns #NUM! for negative numbers.
  EXAMPLES:
    SQRT(144) = 12, SQRT(-1) = #NUM!

### LN / LOG / EXP

  LN(number) — Natural log (base e)
  LOG(number, [base]) — Log with base (default 10)
  EXP(number) — e raised to number
  EXAMPLES:
    LN(2.71828) ≈ 1, LOG(100, 10) = 2, EXP(1) ≈ 2.71828

---

## 3. LOGICAL FUNCTIONS

### IF

  SYNTAX: IF(logical_test, value_if_true, [value_if_false])
  CATEGORY: Logical
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Returns one value if condition is TRUE, another if FALSE.

  PARAMETERS:
    logical_test: any — Expression that evaluates to TRUE/FALSE
    value_if_true: any — Returned when TRUE
    value_if_false: any — Returned when FALSE (optional, defaults to FALSE)

  RETURN: any

  PSEUDOCODE:
    function IF(condition, ifTrue, ifFalse = false):
      if isError(condition): return condition
      if toBoolean(condition): return ifTrue
      return ifFalse

  EXAMPLES:
    Example 1: IF(10>5, "Yes", "No") = "Yes"
    Example 2: IF(A1>100, "Over Budget", "Within Budget")
    Example 3: IF(A1="", 0, A1) — replaces empty with 0
    Example 4: IF(#REF!, "OK", "Bad") = #REF! (error propagates)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: IF(TRUE, 1, 2) should equal 1
    Test case: IF(FALSE, 1, 2) should equal 2

  EDGE CASES:
    Error as condition — propagates the error
    Nested IFs — up to 64 levels (Excel limit)
    Boolean coercion: 0=FALSE, nonzero=TRUE, ""=FALSE, "text"=TRUE

### IFS

  SYNTAX: IFS(condition1, value1, [condition2, value2], ...)
  DESCRIPTION: Checks multiple conditions, returns value for first TRUE.
  No default value — returns #N/A if none match.

  PSEUDOCODE:
    function IFS(...pairs):
      for i = 0 to pairs.length - 1 step 2:
        if toBoolean(pairs[i]): return pairs[i+1]
      return #N/A

  EXAMPLES:
    IFS(A1>90,"A", A1>80,"B", A1>70,"C", TRUE,"F") — grade from score
    IFS(A1="Revenue", 1, A1="Expense", 2, A1="Other", 3)

### SWITCH

  SYNTAX: SWITCH(expression, value1, result1, [value2, result2, ...], [default])
  DESCRIPTION: Matches expression against values, returns corresponding result.

  PSEUDOCODE:
    function SWITCH(expr, ...pairs):
      for i = 0 to pairs.length - 1 step 2:
        if expr == pairs[i]: return pairs[i+1]
      if pairs.length is odd: return pairs[pairs.length - 1]  // default
      return #N/A

  EXAMPLES:
    SWITCH(A1, "Jan", 1, "Feb", 2, "Mar", 3, 0) — month name to number

### AND / OR / NOT

  SYNTAX: AND(condition1, [condition2], ...)
         OR(condition1, [condition2], ...)
         NOT(condition)

  AND: TRUE if ALL conditions are TRUE
  OR: TRUE if ANY condition is TRUE
  NOT: Flips TRUE↔FALSE

  PSEUDOCODE:
    function AND(...args):
      for each arg in flatten(args):
        if not toBoolean(arg): return FALSE
      return TRUE

    function OR(...args):
      for each arg in flatten(args):
        if toBoolean(arg): return TRUE
      return FALSE

  EXAMPLES:
    AND(1>0, 5>3) = TRUE
    AND(1>0, 5<3) = FALSE
    OR(1>0, 5<3) = TRUE
    NOT(TRUE) = FALSE

### IFERROR / IFNA

  SYNTAX: IFERROR(value, value_if_error)
         IFNA(value, value_if_na)

  IFERROR: Returns alternative if value is ANY error (#N/A, #REF!, #DIV/0!, etc.)
  IFNA: Returns alternative ONLY if value is #N/A

  PSEUDOCODE:
    function IFERROR(value, alt):
      if isError(value): return alt
      return value

    function IFNA(value, alt):
      if value == #N/A: return alt
      return value

  EXAMPLES:
    IFERROR(VLOOKUP("X", A:B, 2, FALSE), "Not Found") — "Not Found" if #N/A
    IFNA(VLOOKUP("X", A:B, 2, FALSE), "Not Found") — only catches #N/A

---

## 4. LOOKUP AND REFERENCE FUNCTIONS

### VLOOKUP

  SYNTAX: VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
  CATEGORY: Lookup
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Searches first column of table for value, returns value from specified column.

  PARAMETERS:
    lookup_value: any — Value to find in first column
    table_array: any[][] — Table to search (first column = lookup column)
    col_index_num: number — Column number to return (1-based)
    range_lookup: boolean — TRUE=approximate (sorted asc), FALSE=exact (default)

  RETURN: any or #N/A if not found

  PSEUDOCODE:
    function VLOOKUP(lookup, table, colIndex, rangeLookup = false):
      if colIndex < 1 or colIndex > table[0].length: return #REF!
      if rangeLookup == false:
        // EXACT MATCH — linear scan
        for i = 0 to table.length - 1:
          if table[i][0] == lookup: return table[i][colIndex - 1]
        return #N/A
      else:
        // APPROXIMATE MATCH — binary search (table must be sorted ascending)
        lo = 0, hi = table.length - 1
        while lo <= hi:
          mid = (lo + hi) / 2
          if table[mid][0] <= lookup: lo = mid + 1
          else: hi = mid - 1
        return table[hi][colIndex - 1]  // largest value <= lookup

  EXAMPLES:
    Example 1: VLOOKUP("Widget", A1:C3, 2, FALSE)
      A1="Widget", B1=100, C1=50
      A2="Gadget", B2=200, C2=75
      A3="Widget", B3=150, C3=60
      Returns: 100 (first match)

    Example 2: VLOOKUP(75, A1:B4, 2, TRUE) — approximate match
      A1=0,A2=50,A3=100,A4=150 (sorted)
      Returns: B2 value (50 ≤ 75 < 100)

    Example 3: VLOOKUP("Missing", A1:B3, 2, FALSE) = #N/A

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Known differences: None
    Test case: VLOOKUP("B", {"A",1;"B",2;"C",3}, 2, FALSE) should equal 2

  EDGE CASES:
    lookup_value not found + range_lookup=FALSE → #N/A
    lookup_value not found + range_lookup=TRUE → largest ≤ value
    col_index > columns in table → #REF!
    Empty lookup_value → matches empty cell (first match)

### HLOOKUP

  SYNTAX: HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])
  DESCRIPTION: Same as VLOOKUP but searches first ROW, returns from specified ROW.
  table_array must have lookup values in first row.

  EXAMPLES:
    HLOOKUP("Q1", A1:D2, 2, FALSE)
      A1="Q1", B1="Q2", C1="Q3", D1="Q4"
      A2=100, B2=200, C2=300, D2=400
      Returns: 100

### INDEX

  SYNTAX: INDEX(array, row_num, [col_num])
  CATEGORY: Lookup
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Returns value at intersection of specified row and column in array.

  PSEUDOCODE:
    function INDEX(array, rowNum, colNum = 1):
      if rowNum < 1 or rowNum > array.length: return #REF!
      if colNum < 1 or colNum > array[0].length: return #REF!
      return array[rowNum - 1][colNum - 1]  // 0-indexed internally

  EXAMPLES:
    Example 1: INDEX(A1:C3, 2, 3) → value at row 2, col 3 of A1:C3
    Example 2: INDEX(A1:A10, 5) → 5th value in column A
    Example 3: INDEX({1,2,3;4,5,6;7,8,9}, 2, 2) = 5

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: INDEX({1,2;3,4}, 2, 1) should equal 3

### MATCH

  SYNTAX: MATCH(lookup_value, lookup_array, [match_type])
  CATEGORY: Lookup
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Returns relative position of value in array.

  PARAMETERS:
    lookup_value: any — Value to find
    lookup_array: any[] — One-dimensional array to search
    match_type: number — 0=exact, 1=largest≤(sorted asc), -1=smallest≥(sorted desc)

  RETURN: number (1-based position) or #N/A

  PSEUDOCODE:
    function MATCH(lookup, array, matchType = 1):
      if matchType == 0:
        // EXACT MATCH
        for i = 0 to array.length - 1:
          if array[i] == lookup: return i + 1
        return #N/A
      elif matchType == 1:
        // APPROXIMATE — array sorted ascending, find largest ≤ lookup
        lo = 0, hi = array.length - 1
        while lo <= hi:
          mid = (lo + hi) / 2
          if array[mid] <= lookup: lo = mid + 1
          else: hi = mid - 1
        return hi + 1  // 1-based
      elif matchType == -1:
        // APPROXIMATE — array sorted descending, find smallest ≥ lookup
        lo = 0, hi = array.length - 1
        while lo <= hi:
          mid = (lo + hi) / 2
          if array[mid] >= lookup: lo = mid + 1
          else: hi = mid - 1
        return hi + 1

  EXAMPLES:
    Example 1: MATCH(30, {10,20,30,40}, 0) = 3
    Example 2: MATCH(25, {10,20,30,40}, 1) = 2 (20 ≤ 25)
    Example 3: MATCH("C", {"A","B","C","D"}, 0) = 3

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: MATCH(30, {10,20,30,40}, 0) should equal 3

### XLOOKUP

  SYNTAX: XLOOKUP(lookup_value, lookup_array, return_array, [not_found], [match_mode], [search_mode])
  CATEGORY: Lookup
  EXCEL COMPATIBLE: Yes (Excel 365+)
  DESCRIPTION: Modern replacement for VLOOKUP/HLOOKUP/INDEX+MATCH. Searches in any direction.

  PARAMETERS:
    lookup_value: any
    lookup_array: any[] — Column/row to search
    return_array: any[] — Column/row to return from
    not_found: any — Value if not found (default #N/A)
    match_mode: number — 0=exact(default), -1=exact or next smaller, 1=exact or next larger, 2=wildcard
    search_mode: number — 1=first to last(default), -1=last to first, 2=binary asc, -2=binary desc

  RETURN: any

  PSEUDOCODE:
    function XLOOKUP(lookup, lookupArr, returnArr, notFound=#N/A, matchMode=0, searchMode=1):
      if lookupArr.length != returnArr.length: return #VALUE!
      indices = range(0, lookupArr.length - 1)
      if searchMode == -1: indices.reverse()
      if abs(searchMode) == 2:
        // Binary search
        idx = binarySearch(lookup, lookupArr, matchMode, searchMode > 0)
        if idx == -1: return notFound
        return returnArr[idx]
      else:
        // Linear search
        for i in indices:
          if matchMode == 0 and lookupArr[i] == lookup: return returnArr[i]
          if matchMode == -1 and lookupArr[i] <= lookup: return returnArr[i]  // last match
          if matchMode == 1 and lookupArr[i] >= lookup: return returnArr[i]   // first match
          if matchMode == 2 and wildcardMatch(lookupArr[i], lookup): return returnArr[i]
        return notFound

  EXAMPLES:
    Example 1: XLOOKUP("Widget", A1:A10, C1:C10) — exact match, returns from C
    Example 2: XLOOKUP(50, {10,30,50,70}, {"A","B","C","D"}) = "C"
    Example 3: XLOOKUP(25, {10,30,50,70}, {"A","B","C","D"}, "Not Found", 1) = "B" (30 ≥ 25)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes (365+)
    Test case: XLOOKUP(3, {1,2,3,4}, {"a","b","c","d"}) should equal "c"

### OFFSET

  SYNTAX: OFFSET(reference, rows, cols, [height], [width])
  DESCRIPTION: Returns reference offset from starting point.
  rows/cols: offset from reference (can be negative)
  height/width: size of returned reference (defaults to same as reference)

  EXAMPLES:
    OFFSET(A1, 2, 1) → B3 (2 rows down, 1 col right from A1)
    OFFSET(A1, 0, 0, 3, 2) → A1:B3 (3 rows, 2 cols starting at A1)

### INDIRECT

  SYNTAX: INDIRECT(ref_text, [a1_style])
  DESCRIPTION: Converts text string to cell reference.
  a1_style: TRUE=A1 style (default), FALSE=R1C1 style

  EXAMPLES:
    INDIRECT("A1") → value in A1
    INDIRECT("Sheet2!A1") → value in Sheet2!A1
    INDIRECT("A" & ROW()) → value in column A of current row

  EDGE CASES:
    Invalid reference → #REF!
    Circular reference → #CIRCULAR!

### CHOOSE

  SYNTAX: CHOOSE(index_num, value1, [value2], ...)
  DESCRIPTION: Returns value at specified position (1-based).
  EXAMPLES:
    CHOOSE(2, "A", "B", "C") = "B"
    CHOOSE(1, A1, B1, C1) → value in A1

---

## 5. TEXT FUNCTIONS

### CONCATENATE

  SYNTAX: CONCATENATE(text1, [text2], ...)
  CATEGORY: Text
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Joins text strings. Equivalent to & operator.

  PSEUDOCODE:
    function CONCATENATE(...args):
      result = ""
      for each arg in flatten(args):
        if arg is number: result += numberToString(arg)
        else: result += arg
      return result

  EXAMPLES:
    Example 1: CONCATENATE("Hello", " ", "World") = "Hello World"
    Example 2: CONCATENATE("Total: $", 1234.56) = "Total: $1234.56"
    Example 3: CONCATENATE(A1, B1) where A1="John", B1="Doe" = "JohnDoe"

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: CONCATENATE("A", "B", "C") should equal "ABC"

### LEFT / RIGHT / MID

  SYNTAX: LEFT(text, [num_chars])
         RIGHT(text, [num_chars])
         MID(text, start_num, num_chars)

  LEFT: Extracts characters from the left
  RIGHT: Extracts characters from the right
  MID: Extracts characters from the middle

  PSEUDOCODE:
    function LEFT(text, n = 1):
      return text.substring(0, n)

    function RIGHT(text, n = 1):
      return text.substring(text.length - n)

    function MID(text, start, n):
      return text.substring(start - 1, start - 1 + n)  // 1-based

  EXAMPLES:
    LEFT("Hello World", 5) = "Hello"
    RIGHT("Hello World", 5) = "World"
    MID("Hello World", 7, 5) = "World"
    LEFT("Hello") = "H" (default 1 char)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: MID("Financial", 4, 3) should equal "anc"

### LEN

  SYNTAX: LEN(text)
  DESCRIPTION: Returns number of characters in text string.
  EXAMPLES:
    LEN("Hello") = 5
    LEN("") = 0
    LEN(" ") = 1

### TRIM

  SYNTAX: TRIM(text)
  DESCRIPTION: Removes leading/trailing spaces, reduces multiple spaces to single.
  PSEUDOCODE:
    function TRIM(text):
      return text.trim().replace(/  +/g, " ")
  EXAMPLES:
    TRIM("  Hello   World  ") = "Hello World"

### UPPER / LOWER / PROPER

  UPPER(text) — All uppercase: "hello" → "HELLO"
  LOWER(text) — All lowercase: "HELLO" → "hello"
  PROPER(text) — Title case: "hello world" → "Hello World"

### SUBSTITUTE

  SYNTAX: SUBSTITUTE(text, old_text, new_text, [instance_num])
  DESCRIPTION: Replaces occurrences of old_text with new_text.
  instance_num: which occurrence to replace (optional, replaces all if omitted)

  PSEUDOCODE:
    function SUBSTITUTE(text, old, new, instance = null):
      if instance == null:
        return text.replaceAll(old, new)
      else:
        count = 0
        for i = 0 to text.length - 1:
          if text.substring(i, i + old.length) == old:
            count++
            if count == instance:
              return text.substring(0, i) + new + text.substring(i + old.length)
        return text  // instance not found

  EXAMPLES:
    SUBSTITUTE("Hello World", "World", "Excel") = "Hello Excel"
    SUBSTITUTE("A-B-C-D", "-", "/", 2) = "A-B/C-D" (replace 2nd only)
    SUBSTITUTE("aaaa", "a", "b") = "bbbb"

### FIND / SEARCH

  SYNTAX: FIND(find_text, within_text, [start_num])
         SEARCH(find_text, within_text, [start_num])

  FIND: Case-sensitive, no wildcards
  SEARCH: Case-insensitive, supports * and ? wildcards

  PSEUDOCODE:
    function FIND(find, within, start = 1):
      index = within.indexOf(find, start - 1)
      if index == -1: return #VALUE!
      return index + 1  // 1-based

    function SEARCH(find, within, start = 1):
      pattern = wildcardToRegex(find)  // * → .*, ? → .
      regex = new RegExp(pattern, "i")
      match = within.substring(start - 1).match(regex)
      if not match: return #VALUE!
      return match.index + start  // 1-based

  EXAMPLES:
    FIND("World", "Hello World") = 7
    FIND("world", "Hello World") = #VALUE! (case-sensitive)
    SEARCH("world", "Hello World") = 7 (case-insensitive)
    SEARCH("*plan", "FinPlan Pro") = 4 (wildcard match)

### VALUE

  SYNTAX: VALUE(text)
  DESCRIPTION: Converts text to number.
  EXAMPLES:
    VALUE("123") = 123
    VALUE("$1,234.56") = 1234.56
    VALUE("15%") = 0.15
    VALUE("abc") = #VALUE!

### TEXT

  SYNTAX: TEXT(value, format_text)
  DESCRIPTION: Formats number as text with specified format.
  EXAMPLES:
    TEXT(1234.5, "#,##0.00") = "1,234.50"
    TEXT(0.15, "0.0%") = "15.0%"
    TEXT(DATE(2026,1,15), "MM/DD/YYYY") = "01/15/2026"

---

## 6. DATE AND TIME FUNCTIONS

### DATE

  SYNTAX: DATE(year, month, day)
  CATEGORY: Date
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Creates a date from year, month, day numbers.
  Auto-corrects overflow: DATE(2026, 13, 1) = 2027-01-01

  PSEUDOCODE:
    function DATE(year, month, day):
      // Auto-correct month overflow
      while month > 12: month -= 12; year++
      while month < 1: month += 12; year--
      // Auto-correct day overflow
      date = new Date(year, month - 1, 1)
      date.setDate(day)  // handles overflow automatically
      return date

  EXAMPLES:
    Example 1: DATE(2026, 5, 18) = 2026-05-18
    Example 2: DATE(2026, 14, 1) = 2027-02-01 (month overflow)
    Example 3: DATE(2026, 1, 32) = 2026-02-01 (day overflow)
    Example 4: DATE(2026, -1, 1) = 2025-11-01 (negative month)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: DATE(2026, 5, 18) should return 2026-05-18

### YEAR / MONTH / DAY

  YEAR(date) — Returns year (2026)
  MONTH(date) — Returns month (1-12)
  DAY(date) — Returns day (1-31)

  EXAMPLES:
    YEAR(2026-05-18) = 2026
    MONTH(2026-05-18) = 5
    DAY(2026-05-18) = 18

### TODAY / NOW

  TODAY() — Current date (midnight)
  NOW() — Current date and time

  NOTE: Both are volatile — recalculates on every sheet change.

### EDATE

  SYNTAX: EDATE(start_date, months)
  DESCRIPTION: Date that is N months before/after start_date.
  Preserves end-of-month: EDATE(2026-01-31, 1) = 2026-02-28

  PSEUDOCODE:
    function EDATE(start, months):
      result = new Date(start)
      result.setMonth(result.getMonth() + months)
      // End-of-month preservation
      if start.getDate() == lastDayOfMonth(start):
        result.setDate(lastDayOfMonth(result))
      return result

  EXAMPLES:
    EDATE(2026-01-15, 3) = 2026-04-15
    EDATE(2026-01-31, 1) = 2026-02-28
    EDATE(2026-03-31, -1) = 2026-02-28

### EOMONTH

  SYNTAX: EOMONTH(start_date, months)
  DESCRIPTION: Last day of month N months before/after start_date.

  PSEUDOCODE:
    function EOMONTH(start, months):
      result = new Date(start)
      result.setMonth(result.getMonth() + months + 1)
      result.setDate(0)  // last day of previous month
      return result

  EXAMPLES:
    EOMONTH(2026-01-15, 0) = 2026-01-31
    EOMONTH(2026-01-15, 2) = 2026-03-31
    EOMONTH(2026-01-31, 1) = 2026-02-28

### NETWORKDAYS

  SYNTAX: NETWORKDAYS(start_date, end_date, [holidays])
  DESCRIPTION: Number of working days between two dates (excludes weekends Sat/Sun).

  PSEUDOCODE:
    function NETWORKDAYS(start, end, holidays = []):
      count = 0
      current = new Date(start)
      while current <= end:
        dayOfWeek = current.getDay()  // 0=Sun, 6=Sat
        if dayOfWeek != 0 and dayOfWeek != 6:
          if not holidays.includes(current):
            count++
        current.setDate(current.getDate() + 1)
      return count

  EXAMPLES:
    NETWORKDAYS(2026-01-05, 2026-01-09) = 5 (Mon-Fri)
    NETWORKDAYS(2026-01-03, 2026-01-10) = 5 (Sat-Sun excluded)
    NETWORKDAYS(2026-01-05, 2026-01-09, [2026-01-06]) = 4 (holiday excluded)

### DATEDIF

  SYNTAX: DATEDIF(start_date, end_date, unit)
  DESCRIPTION: Difference between dates in specified unit.
  Units: "Y"=years, "M"=months, "D"=days, "YM"=months ignoring years, "YD"=days ignoring years

  EXAMPLES:
    DATEDIF(2020-01-15, 2026-05-18, "Y") = 6
    DATEDIF(2020-01-15, 2026-05-18, "M") = 76
    DATEDIF(2020-01-15, 2026-05-18, "D") = 2315

### WEEKDAY

  SYNTAX: WEEKDAY(serial_number, [return_type])
  DESCRIPTION: Day of week as number.
  return_type: 1=Sun(1)-Sat(7), 2=Mon(1)-Sun(7), 3=Mon(0)-Sun(6)

  EXAMPLES:
    WEEKDAY(2026-05-18, 2) = 1 (Monday)

### WEEKNUM

  SYNTAX: WEEKNUM(serial_number, [return_type])
  DESCRIPTION: Week number of the year.
  return_type: 1=Sun start, 2=Mon start

  EXAMPLES:
    WEEKNUM(2026-01-01, 2) = 1

---

## 7. FINANCIAL FUNCTIONS

### NPV

  SYNTAX: NPV(rate, value1, [value2], ...)
  CATEGORY: Financial
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Net Present Value. First cash flow is at period 1 (NOT period 0).
  NPV = CF1/(1+r)^1 + CF2/(1+r)^2 + ... + CFn/(1+r)^n

  PARAMETERS:
    rate: number — Discount rate per period (e.g., 0.1 for 10%)
    value1..value254: number[] — Cash flows starting at period 1

  RETURN: number

  PSEUDOCODE:
    function NPV(rate, ...values):
      flat = flatten(values)
      npv = 0
      for i = 0 to flat.length - 1:
        npv += flat[i] / (1 + rate) ^ (i + 1)
      return npv

  EXAMPLES:
    Example 1: NPV(0.1, -1000, 300, 420, 680)
      = -1000/1.1 + 300/1.21 + 420/1.331 + 680/1.4641
      = -909.09 + 247.93 + 315.40 + 464.60 = 118.84

    Example 2: NPV(0.08, 100, 200, 300) = 100/1.08 + 200/1.1664 + 300/1.2597 = 502.21

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Known differences: Excel NPV starts at period 1 (not 0). Add initial investment separately.
    Test case: NPV(0.1, 100, 200, 300) should equal 481.59 (rounded)

  EDGE CASES:
    rate = 0 → sum of all values
    rate = -1 → #DIV/0!
    Empty values → skipped

### IRR

  SYNTAX: IRR(values, [guess])
  CATEGORY: Financial
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Internal Rate of Return. Rate where NPV = 0.
  Uses Newton-Raphson iteration.

  PARAMETERS:
    values: number[] — Cash flows (must include at least one positive and one negative)
    guess: number — Initial guess (default 0.1 = 10%)

  RETURN: number (decimal, e.g., 0.15 = 15%) or #NUM! if no convergence

  PSEUDOCODE:
    function IRR(values, guess = 0.1):
      rate = guess
      MAX_ITER = 100
      TOLERANCE = 1e-7

      for iter = 1 to MAX_ITER:
        npv = 0
        npvDeriv = 0
        for i = 0 to values.length - 1:
          denominator = (1 + rate) ^ i
          npv += values[i] / denominator
          if i > 0:
            npvDeriv -= i * values[i] / ((1 + rate) ^ (i + 1))

        if abs(npv) < TOLERANCE: return rate
        if npvDeriv == 0: break  // no convergence

        rate = rate - npv / npvDeriv  // Newton-Raphson step

      return #NUM!  // failed to converge

  EXAMPLES:
    Example 1: IRR({-100, 50, 40, 30, 20})
      = rate where -100 + 50/(1+r) + 40/(1+r)^2 + 30/(1+r)^3 + 20/(1+r)^4 = 0
      ≈ 0.1509 (15.09%)

    Example 2: IRR({-1000, 200, 300, 400, 500}) ≈ 0.1283 (12.83%)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Known differences: Convergence may differ slightly due to floating point
    Test case: IRR({-100, 50, 40, 30, 20}) should be ≈ 0.1509

  EDGE CASES:
    No negative values → #NUM!
    No positive values → #NUM!
    All zeros → #NUM!
    No convergence within 100 iterations → #NUM!
    Multiple IRR rates → returns one (depends on guess)

### XNPV

  SYNTAX: XNPV(rate, values, dates)
  DESCRIPTION: NPV with specific dates (not just periods).
  XNPV = Σ values[i] / (1 + rate) ^ ((dates[i] - dates[0]) / 365)

  PSEUDOCODE:
    function XNPV(rate, values, dates):
      xnpv = 0
      startDate = dates[0]
      for i = 0 to values.length - 1:
        days = (dates[i] - startDate) / (365.25 * 24 * 60 * 60 * 1000)  // ms to years
        xnpv += values[i] / (1 + rate) ^ days
      return xnpv

  EXAMPLES:
    XNPV(0.1, {-10000, 5000, 4000, 3000}, {2020-01-01, 2021-01-01, 2022-01-01, 2023-01-01})

### XIRR

  SYNTAX: XIRR(values, dates, [guess])
  DESCRIPTION: IRR with specific dates. Uses Newton-Raphson like IRR.
  Same algorithm as IRR but uses XNPV formula for NPV calculation.

### PV

  SYNTAX: PV(rate, nper, pmt, [fv], [type])
  CATEGORY: Financial
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Present Value of an investment.
  PV = -FV/(1+r)^n - PMT * [(1-(1+r)^-n)/r]  (type=0, end of period)

  PARAMETERS:
    rate: number — Interest rate per period
    nper: number — Total number of periods
    pmt: number — Payment per period
    fv: number — Future value (default 0)
    type: number — 0=end of period (default), 1=beginning of period

  RETURN: number (negative = money you'd invest today)

  PSEUDOCODE:
    function PV(rate, nper, pmt, fv = 0, type = 0):
      if rate == 0:
        return -(fv + pmt * nper)
      pv = -(fv + pmt * (1 + rate * type) * ((1 + rate)^nper - 1) / rate) / (1 + rate)^nper
      return pv

  EXAMPLES:
    Example 1: PV(0.05, 10, -1000) = 7,721.73 (value today of $1000/yr for 10 years at 5%)
    Example 2: PV(0.08, 5, 0, -10000) = 6,805.83 (PV of $10,000 in 5 years at 8%)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: PV(0.05, 10, -1000) should equal 7721.73

### FV

  SYNTAX: FV(rate, nper, pmt, [pv], [type])
  DESCRIPTION: Future Value of an investment.
  FV = -PV * (1+r)^n - PMT * [((1+r)^n - 1)/r]  (type=0)

  PSEUDOCODE:
    function FV(rate, nper, pmt, pv = 0, type = 0):
      if rate == 0:
        return -(pv + pmt * nper)
      fv = -(pv * (1 + rate)^nper + pmt * (1 + rate * type) * ((1 + rate)^nper - 1) / rate)
      return fv

  EXAMPLES:
    Example 1: FV(0.06, 20, -5000) = 183,927.96 (value after 20 years of $5000/yr at 6%)
    Example 2: FV(0.05, 10, 0, -10000) = 16,288.95 ($10,000 grows to $16,289 in 10 years at 5%)

### PMT

  SYNTAX: PMT(rate, nper, pv, [fv], [type])
  DESCRIPTION: Payment for a loan based on constant payments and constant interest rate.

  PSEUDOCODE:
    function PMT(rate, nper, pv, fv = 0, type = 0):
      if rate == 0:
        return -(pv + fv) / nper
      pmt = -(pv * (1 + rate)^nper + fv) * rate / ((1 + rate * type) * ((1 + rate)^nper - 1))
      return pmt

  EXAMPLES:
    Example 1: PMT(0.06/12, 360, 200000) = -1199.10 (monthly payment on $200K mortgage, 6%, 30yr)
    Example 2: PMT(0.08/12, 60, 30000) = -608.29 (monthly payment on $30K car loan, 8%, 5yr)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: PMT(0.06/12, 360, 200000) should equal -1199.10

### IPMT

  SYNTAX: IPMT(rate, per, nper, pv, [fv], [type])
  DESCRIPTION: Interest portion of a payment for a given period.

  PSEUDOCODE:
    function IPMT(rate, per, nper, pv, fv = 0, type = 0):
      pmt = PMT(rate, nper, pv, fv, type)
      // Balance at start of period
      if per == 1:
        balance = pv
      else:
        balance = pv * (1 + rate)^(per-1) - pmt * ((1 + rate)^(per-1) - 1) / rate
      interest = -balance * rate
      return interest

  EXAMPLES:
    IPMT(0.06/12, 1, 360, 200000) = -1000.00 (first month interest on $200K mortgage)
    IPMT(0.06/12, 360, 360, 200000) = -5.97 (last month interest)

### PPMT

  SYNTAX: PPMT(rate, per, nper, pv, [fv], [type])
  DESCRIPTION: Principal portion of a payment for a given period.
  PPMT = PMT - IPMT

  EXAMPLES:
    PPMT(0.06/12, 1, 360, 200000) = -199.10 (first month principal)
    PPMT(0.06/12, 360, 360, 200000) = -1193.13 (last month principal)

### SLN

  SYNTAX: SLN(cost, salvage, life)
  DESCRIPTION: Straight-line depreciation per period.
  SLN = (cost - salvage) / life

  EXAMPLES:
    SLN(10000, 2000, 5) = 1600 per year

### DB

  SYNTAX: DB(cost, salvage, life, period, [month])
  DESCRIPTION: Fixed-declining balance depreciation.
  Rate = 1 - (salvage/cost)^(1/life), rounded to 3 decimal places.

  EXAMPLES:
    DB(10000, 1000, 5, 1) ≈ 3690 (first year)
    DB(10000, 1000, 5, 2) ≈ 2328 (second year)

### DDB

  SYNTAX: DDB(cost, salvage, life, period, [factor])
  DESCRIPTION: Double-declining balance depreciation.
  factor defaults to 2 (200% declining balance).
  Rate = factor / life

  EXAMPLES:
    DDB(10000, 1000, 5, 1) = 4000 (first year, 2/5 = 40%)
    DDB(10000, 1000, 5, 2) = 2400 (second year)

### SYD

  SYNTAX: SYD(cost, salvage, life, per)
  DESCRIPTION: Sum-of-years' digits depreciation.
  SYD = (cost - salvage) * (life - per + 1) / (life * (life + 1) / 2)

  EXAMPLES:
    SYD(10000, 1000, 5, 1) = 3000 (first year)
    SYD(10000, 1000, 5, 2) = 2400 (second year)

### EFFECT

  SYNTAX: EFFECT(nominal_rate, npery)
  DESCRIPTION: Effective annual interest rate from nominal rate and compounding periods.
  EFFECT = (1 + nominal/npery)^npery - 1

  EXAMPLES:
    EFFECT(0.06, 12) = 0.06168 (6.168% effective rate from 6% compounded monthly)

### NOMINAL

  SYNTAX: NOMINAL(effect_rate, npery)
  DESCRIPTION: Nominal annual rate from effective rate.
  NOMINAL = npery * ((1 + effect)^(1/npery) - 1)

  EXAMPLES:
    NOMINAL(0.06168, 12) ≈ 0.06 (6% nominal from 6.168% effective)

---

## 8. STATISTICAL FUNCTIONS

### STDEV

  SYNTAX: STDEV(number1, [number2], ...)
  CATEGORY: Statistical
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Standard deviation of a sample (uses N-1 denominator).

  PSEUDOCODE:
    function STDEV(...args):
      flat = flatten(args)
      n = countNumbers(flat)
      if n < 2: return #DIV/0!
      mean = SUM(flat) / n
      sumSqDev = 0
      for each value in flat:
        if isNumber(value): sumSqDev += (value - mean) ^ 2
      return sqrt(sumSqDev / (n - 1))

  EXAMPLES:
    Example 1: STDEV(10, 20, 30, 40, 50) = 15.81
    Example 2: STDEV(A1:A5) where A1=5,A2=10,A3=15,A4=20,A5=25 = 7.91

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: STDEV({10,20,30,40,50}) should equal 15.81 (rounded)

### STDEVP

  SYNTAX: STDEVP(number1, [number2], ...)
  DESCRIPTION: Standard deviation of entire population (uses N denominator).
  PSEUDOCODE:
    function STDEVP(...args):
      // Same as STDEV but divides by N instead of N-1
      return sqrt(sumSqDev / n)

### VAR

  SYNTAX: VAR(number1, [number2], ...)
  DESCRIPTION: Variance of a sample (N-1). = STDEV^2

  PSEUDOCODE:
    function VAR(...args):
      // Same as STDEV but returns sumSqDev / (n-1) without sqrt
      return sumSqDev / (n - 1)

  EXAMPLES:
    VAR(10, 20, 30, 40, 50) = 250

### VARP

  SYNTAX: VARP(number1, [number2], ...)
  DESCRIPTION: Variance of entire population (N denominator).

### PERCENTILE

  SYNTAX: PERCENTILE(array, k)
  DESCRIPTION: Value at kth percentile. k must be 0-1.
  Uses linear interpolation between closest ranks.

  PSEUDOCODE:
    function PERCENTILE(array, k):
      sorted = sort(array)
      n = sorted.length
      rank = k * (n - 1)  // 0-based rank
      lower = floor(rank)
      upper = ceil(rank)
      fraction = rank - lower
      return sorted[lower] + fraction * (sorted[upper] - sorted[lower])

  EXAMPLES:
    Example 1: PERCENTILE({1,2,3,4,5}, 0.5) = 3 (median)
    Example 2: PERCENTILE({1,2,3,4,5}, 0.25) = 2 (25th percentile)
    Example 3: PERCENTILE({1,2,3,4,5}, 0.75) = 4 (75th percentile)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: PERCENTILE({1,2,3,4,5}, 0.3) should equal 2.2

### QUARTILE

  SYNTAX: QUARTILE(array, quart)
  DESCRIPTION: Returns quartile of dataset. quart: 0=Min, 1=Q1, 2=Median, 3=Q3, 4=Max

  PSEUDOCODE:
    function QUARTILE(array, quart):
      return PERCENTILE(array, quart * 0.25)

  EXAMPLES:
    QUARTILE({1,2,3,4,5,6,7,8,9,10}, 0) = 1 (Min)
    QUARTILE({1,2,3,4,5,6,7,8,9,10}, 1) = 3.25 (Q1)
    QUARTILE({1,2,3,4,5,6,7,8,9,10}, 2) = 5.5 (Median)
    QUARTILE({1,2,3,4,5,6,7,8,9,10}, 3) = 7.75 (Q3)
    QUARTILE({1,2,3,4,5,6,7,8,9,10}, 4) = 10 (Max)

### CORREL

  SYNTAX: CORREL(array1, array2)
  DESCRIPTION: Pearson correlation coefficient between two datasets. Returns -1 to 1.

  PSEUDOCODE:
    function CORREL(arr1, arr2):
      n = arr1.length
      if n != arr2.length or n < 2: return #N/A
      mean1 = AVERAGE(arr1), mean2 = AVERAGE(arr2)
      sumProduct = 0, sumSq1 = 0, sumSq2 = 0
      for i = 0 to n - 1:
        d1 = arr1[i] - mean1
        d2 = arr2[i] - mean2
        sumProduct += d1 * d2
        sumSq1 += d1 * d1
        sumSq2 += d2 * d2
      if sumSq1 == 0 or sumSq2 == 0: return #DIV/0!
      return sumProduct / sqrt(sumSq1 * sumSq2)

  EXAMPLES:
    Example 1: CORREL({1,2,3,4,5}, {2,4,6,8,10}) = 1.0 (perfect positive)
    Example 2: CORREL({1,2,3,4,5}, {10,8,6,4,2}) = -1.0 (perfect negative)
    Example 3: CORREL({1,2,3}, {4,5,6}) = 1.0 (perfect linear)

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: CORREL({1,2,3,4,5}, {2,4,6,8,10}) should equal 1.0

### FORECAST

  SYNTAX: FORECAST(x, known_y's, known_x's)
  DESCRIPTION: Predicts y-value for given x using linear regression.
  y = intercept + slope * x

  PSEUDOCODE:
    function FORECAST(x, knownY, knownX):
      n = knownY.length
      if n != knownX.length or n < 2: return #N/A
      meanX = AVERAGE(knownX), meanY = AVERAGE(knownY)
      sumXY = 0, sumXX = 0
      for i = 0 to n - 1:
        dx = knownX[i] - meanX
        dy = knownY[i] - meanY
        sumXY += dx * dy
        sumXX += dx * dx
      if sumXX == 0: return #DIV/0!
      slope = sumXY / sumXX
      intercept = meanY - slope * meanX
      return intercept + slope * x

  EXAMPLES:
    Example 1: FORECAST(6, {2,4,6,8,10}, {1,2,3,4,5}) = 12 (perfect linear)
    Example 2: FORECAST(10, {100,200,300}, {1,2,3}) = 1000 (extrapolation)

---

## 9. AGGREGATE FUNCTIONS

### SUBTOTAL

  SYNTAX: SUBTOTAL(function_num, ref1, [ref2], ...)
  CATEGORY: Aggregate
  EXCEL COMPATIBLE: Yes
  DESCRIPTION: Performs specified function on visible cells only.

  FUNCTION NUMBERS:
    1/101: AVERAGE (101 ignores hidden)
    2/102: COUNT
    3/103: COUNTA
    4/104: MAX
    5/105: MIN
    6/106: PRODUCT
    7/107: STDEV
    8/108: STDEVP
    9/109: SUM
    10/110: VAR
    11/111: VARP

  PSEUDOCODE:
    function SUBTOTAL(funcNum, ...refs):
      flat = flatten(refs)
      visible = filter(flat, cell => not isHidden(cell))
      switch funcNum:
        case 1 or 101: return AVERAGE(visible)
        case 2 or 102: return COUNT(visible)
        case 3 or 103: return COUNTA(visible)
        case 4 or 104: return MAX(visible)
        case 5 or 105: return MIN(visible)
        case 6 or 106: return PRODUCT(visible)
        case 9 or 109: return SUM(visible)
        // ... etc.

  EXAMPLES:
    SUBTOTAL(9, A1:A10) — SUM of visible cells in A1:A10
    SUBTOTAL(109, A1:A10) — SUM ignoring manually hidden rows

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Known differences: SUBTOTAL ignores other SUBTOTAL results (no double-counting)

### SUMPRODUCT

  SYNTAX: SUMPRODUCT(array1, [array2], ...)
  DESCRIPTION: Multiplies corresponding elements and sums the products.
  Equivalent to SUM(A1:A5 * B1:B5) but without array formula.

  PSEUDOCODE:
    function SUMPRODUCT(...arrays):
      if arrays.length == 1: return SUM(arrays[0])
      result = 0
      for i = 0 to arrays[0].length - 1:
        product = 1
        for each arr in arrays:
          if isNumber(arr[i]): product *= arr[i]
          else: product = 0; break
        result += product
      return result

  EXAMPLES:
    Example 1: SUMPRODUCT({1,2,3}, {4,5,6}) = 1*4 + 2*5 + 3*6 = 32
    Example 2: SUMPRODUCT({10,20,30}, {1,0,1}) = 10*1 + 20*0 + 30*1 = 40 (conditional sum)
    Example 3: SUMPRODUCT((A1:A3="Revenue")*B1:B3) — sum of B where A="Revenue"

  EXCEL COMPATIBILITY:
    Matches Excel: Yes
    Test case: SUMPRODUCT({1,2,3}, {4,5,6}) should equal 32

### MEDIAN

  SYNTAX: MEDIAN(number1, [number2], ...)
  DESCRIPTION: Middle value of dataset. For even count, average of two middle values.

  PSEUDOCODE:
    function MEDIAN(...args):
      sorted = sort(flat(args)).filter(isNumber)
      n = sorted.length
      if n == 0: return #NUM!
      if n % 2 == 1: return sorted[(n-1)/2]
      return (sorted[n/2 - 1] + sorted[n/2]) / 2

  EXAMPLES:
    MEDIAN(1,2,3,4,5) = 3
    MEDIAN(1,2,3,4) = 2.5 (average of 2 and 3)

### MODE

  SYNTAX: MODE(number1, [number2], ...)
  DESCRIPTION: Most frequently occurring value. Returns first if tie.

  EXAMPLES:
    MODE(1,2,2,3,3,3,4) = 3
    MODE(1,1,2,2,3) = 1 (first occurring)

### RANK

  SYNTAX: RANK(number, ref, [order])
  DESCRIPTION: Position of number in list sorted in descending order.
  order: 0=descending (default), 1=ascending

  PSEUDOCODE:
    function RANK(number, ref, order = 0):
      sorted = sort(ref, descending = (order == 0))
      for i = 0 to sorted.length - 1:
        if sorted[i] == number: return i + 1
      return #N/A

  EXAMPLES:
    RANK(3, {1,2,3,4,5}) = 3 (3rd largest)
    RANK(3, {1,2,3,4,5}, 1) = 3 (3rd smallest)

---

## 10. IMPLEMENTATION NOTES

### Dependency Resolution
  - Build DAG of cell dependencies
  - Topological sort for evaluation order
  - Dirty flag propagation for incremental recalc

### Floating-Point Precision
  - IEEE 754 double precision
  - ROUND only at display layer
  - Kahan summation for financial totals

### Performance Targets
  - Single function: < 0.01ms
  - 100K cells SUM/AVERAGE: < 50ms
  - 1M cells complex formulas: < 500ms

---
