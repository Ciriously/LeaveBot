/**
 * Cancels a leave request by updating "Team Lead Verdict" and "Reason for Verdict" columns.
 * @param {string} text - The text from the Slack command (should contain "LID" and reason for cancellation).
 * @returns {string} - Success or error message.
 */
function cancelLeaveRequest(text) {
  try {
    if (!text.includes(" ")) {
      return "❌ ERROR: Invalid input. Please provide the Request ID and reason for cancellation (e.g., LID-12345 Cancelled by user: Reason)";
    }

    let [lid, ...reasonParts] = text.split(" ");
    let reason = reasonParts.join(" ").trim();

    if (!/^LID-\d+$/.test(lid)) {
      return "❌ ERROR: Invalid Request ID format. Please use the format 'LID-12345'.";
    }

    if (reason.length < 5) {
      return "❌ ERROR: The cancellation reason is too short. Please provide a more descriptive reason.";
    }

    let sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // Define column indexes using constants (Column A: Request ID, Column E: From Date, Column K: Team Lead Verdict, Column L: Reason for Verdict)
    const REQUEST_ID_COL = 0; // Column A (0-indexed)
    const FROM_DATE_COL = 4; // Column E (0-indexed)
    const VERDICT_COL = 10; // Column K (0-indexed)
    const REASON_COL = 11; // Column L (0-indexed)

    let data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues(); // Fetch only relevant columns starting from row 2

    // Validate if the necessary columns exist
    if (VERDICT_COL >= data[0].length || REASON_COL >= data[0].length) {
      return "❌ ERROR: 'Team Lead Verdict' or 'Reason for Verdict' columns not found in the sheet.";
    }

    for (let i = 0; i < data.length; i++) {
      if (data[i][REQUEST_ID_COL] === lid) {
        if (data[i][VERDICT_COL] === "Cancelled") {
          return `❌ ERROR: Leave request ${lid} is already cancelled.`;
        }

        let fromDate = data[i][FROM_DATE_COL];
        if (!isFutureDate(fromDate)) {
          return `❌ ERROR: Leave request ${lid} cannot be cancelled because it has already started or is in the past.`;
        }

        sheet.getRange(i + 2, VERDICT_COL + 1).setValue("Cancelled");
        sheet
          .getRange(i + 2, REASON_COL + 1)
          .setValue(`Cancelled by user: ${reason}`);
        return `✅ Leave request ${lid} has been successfully cancelled.`;
      }
    }

    return `❌ ERROR: Leave request with ID ${lid} not found.`;
  } catch (error) {
    Logger.log(`🚨 Error in cancelLeaveRequest: ${error.message}`);
    return `🚨 Error cancelling leave request: ${error.message}`;
  }
}

/**
 * Test function to verify cancelLeaveRequest behavior.
 */
function testCancelLeaveRequest() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (!sheet) {
    Logger.log("❌ ERROR: Sheet not found.");
    return;
  }

  // Test cases
  const testCases = [
    {
      description: "✅ Valid Cancel Request for Future Date",
      input: "LID-1739776046 Cancellation requested due to change in plans",
      expected:
        "✅ Leave request LID-1739015137 has been successfully cancelled.",
    },
    {
      description: "❌ Cancel Request for Past Date",
      input: "LID-12346 Change in plans",
      expected:
        "❌ ERROR: Leave request LID-12346 cannot be cancelled because it has already started or is in the past.",
    },
    {
      description: "❌ Cancel Already Cancelled Request",
      input: "LID-12347 I no longer need the leave",
      expected: "❌ ERROR: Leave request LID-12347 is already cancelled.",
    },
    {
      description: "❌ Leave Request ID Not Found",
      input: "LID-99999 Cancellation due to scheduling conflict",
      expected: "❌ ERROR: Leave request with ID LID-99999 not found.",
    },
    {
      description: "❌ Invalid Leave ID Format",
      input: "12345 Cancellation requested",
      expected:
        "❌ ERROR: Invalid Request ID format. Please use the format 'LID-12345'.",
    },
    {
      description: "❌ Missing Reason for Cancellation",
      input: "LID-12345",
      expected:
        "❌ ERROR: Invalid input. Please provide the Request ID and reason for cancellation (e.g., LID-12345 Cancelled by user: Reason)",
    },
  ];

  // Run each test case
  testCases.forEach((test) => {
    const result = cancelLeaveRequest(test.input);
    const pass = result === test.expected;

    Logger.log(`Test: ${test.description}`);
    Logger.log(`  Input: ${test.input}`);
    Logger.log(`  Expected: ${test.expected}`);
    Logger.log(`  Actual: ${result}`);
    Logger.log(`  Result: ${pass ? "✅ PASS" : "❌ FAIL"}`);
  });
}
