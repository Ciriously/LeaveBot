// dateValidations.js
/**
 * Validates if the given date string is in DD/MM/YYYY format.
 * @param {string} dateStr - The date string to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
function isValidDateFormat(dateStr) {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  return dateRegex.test(dateStr);
}

/**
 * Validates if the "from" date is earlier than or equal to the "to" date.
 * @param {string} fromDate - The start date in DD/MM/YYYY format.
 * @param {string} toDate - The end date in DD/MM/YYYY format.
 * @returns {boolean} - True if valid, false otherwise.
 */
function isValidDateRange(fromDate, toDate) {
  let [fromDay, fromMonth, fromYear] = fromDate.split("/").map(Number);
  let [toDay, toMonth, toYear] = toDate.split("/").map(Number);

  let from = new Date(fromYear, fromMonth - 1, fromDay);
  let to = new Date(toYear, toMonth - 1, toDay);

  return from <= to;
}

/**
 * Validates if the given date is today or in the future.
 * Ensures proper date handling by comparing with today's date.
 * @param {string} dateStr - The date string in DD/MM/YYYY format.
 * @returns {boolean} - True if the date is today or a future date, false if it's in the past.
 */
function isFutureDate(dateStr) {
  // Validate date format first
  if (!isValidDateFormat(dateStr)) return false;

  let [day, month, year] = dateStr.split("/").map(Number);

  // Create a date object from the input
  let givenDate = new Date(year, month - 1, day);

  // Check if the constructed date is valid (e.g., handles cases like 31/02/2025)
  if (
    givenDate.getDate() !== day ||
    givenDate.getMonth() !== month - 1 ||
    givenDate.getFullYear() !== year
  ) {
    return false; // Invalid date
  }

  // Set today's date to midnight for accurate date comparison
  let today = new Date();
  today.setHours(0, 0, 0, 0); // Ensure time is reset to 00:00:00

  // Compare dates
  return givenDate >= today;
}

/**
 * Validates if the given leave ID follows the correct format.
 * @param {string} leaveID - The leave ID to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
function isValidLeaveID(leaveID) {
  const leaveIDRegex = /^LID-\d+$/;
  return leaveIDRegex.test(leaveID);
}

/**
 * Validates if the given date string is in DD/MM/YYYY format.
 * @param {string} dateStr - The date string to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
function isValidDateFormat(dateStr) {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  return dateRegex.test(dateStr);
}

/**
 * Test function to validate all date-related functions.
 */

function testDateValidations() {
  const testCases = [
    {
      description: "✅ Valid Date Format (DD/MM/YYYY)",
      functionToTest: isValidDateFormat,
      input: "14/02/2025",
      expected: true,
    },
    {
      description: "❌ Invalid Date Format (MM-DD-YYYY)",
      functionToTest: isValidDateFormat,
      input: "02-14-2025",
      expected: false,
    },
    {
      description: "❌ Invalid Date Format (Non-Date String)",
      functionToTest: isValidDateFormat,
      input: "random text",
      expected: false,
    },
    {
      description: "✅ Valid Date Range (From <= To)",
      functionToTest: isValidDateRange,
      input: ["14/02/2025", "16/02/2025"],
      expected: true,
    },
    {
      description: "❌ Invalid Date Range (From > To)",
      functionToTest: isValidDateRange,
      input: ["16/02/2025", "14/02/2025"],
      expected: false,
    },
    {
      description: "✅ Date is Today",
      functionToTest: isFutureDate,
      input: new Date().toLocaleDateString("en-GB"), // Formats today's date as DD/MM/YYYY
      expected: true,
    },
    {
      description: "✅ Date is in the Future",
      functionToTest: isFutureDate,
      input: "14/02/2025",
      expected: true,
    },
    {
      description: "❌ Date is in the Past",
      functionToTest: isFutureDate,
      input: "01/01/2023",
      expected: false,
    },
    {
      description: "❌ Invalid Date (Non-existent date)",
      functionToTest: isFutureDate,
      input: "31/02/2025", // Invalid date
      expected: false,
    },
  ];

  Logger.log("🛠 Starting Date Validations Tests...");

  testCases.forEach((test) => {
    let actual;
    if (Array.isArray(test.input)) {
      // If multiple inputs (e.g., isValidDateRange)
      actual = test.functionToTest(...test.input);
    } else {
      // Single input functions
      actual = test.functionToTest(test.input);
    }

    let result = actual === test.expected ? "✅ PASS" : "❌ FAIL";
    Logger.log(`Test: ${test.description}`);
    Logger.log(`  Input: ${JSON.stringify(test.input)}`);
    Logger.log(`  Expected: ${test.expected}, Actual: ${actual}`);
    Logger.log(`  Result: ${result}`);
  });

  Logger.log("✅ All Date Validation Tests Completed.");
}
