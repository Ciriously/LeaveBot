function getLeaveStatusV2(leaveID) {
  try {
    // Validate leaveID format using the imported function
    if (!isValidLeaveID(leaveID)) {
      return { error: "❌ Error: Invalid leave ID format." };
    }

    // Use cache to store sheet data for a short period (5 minutes)
    let cache = CacheService.getScriptCache();
    let cachedData = cache.get("leave_data");
    let data;
    let currentTime = new Date().getTime();
    let cachedTime = cache.get("leave_data_time")
      ? parseInt(cache.get("leave_data_time"))
      : 0;

    if (cachedData && currentTime - cachedTime < 300000) {
      // Use cached data if less than 5 minutes old
      // Cache is available and fresh, parse it
      data = JSON.parse(cachedData);
    } else {
      // Open the Google Sheet and get data from columns directly
      let sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      if (!sheet) {
        return { error: "❌ Error: 'Leaves_request' sheet not found." };
      }

      // Fetch only necessary columns: Request Id (Column A), Team Lead Verdict (Column K), and Reason for Verdict (Column L)
      let dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12); // Fetch from Column A to Column L (12 columns)
      data = dataRange.getValues();

      if (!data || data.length === 0) {
        return { error: "❌ Error: No valid leave requests found." };
      }

      // Cache the data for 5 minutes
      cache.put("leave_data", JSON.stringify(data), 150); // Cache data for 5 minutes
      cache.put("leave_data_time", currentTime.toString(), 150); // Store timestamp of cached data
    }

    // Iterate through the cached data to find the leave request by ID
    for (let i = 0; i < data.length; i++) {
      let row = data[i];
      let requestID = row[0]; // Column A (Request Id)
      let teamLeadVerdict = row[10] || "Pending"; // Column K (Team Lead Verdict)
      let reasonForVerdict = row[11] || "No reason provided"; // Column L (Reason for Verdict)

      if (requestID === leaveID) {
        let responseMessage =
          `✅ *Leave Status for Request ID: ${leaveID}*\n` +
          `🔹 *Team Lead Verdict:* ${teamLeadVerdict} ${
            teamLeadVerdict === "Approved"
              ? "✔️"
              : teamLeadVerdict === "Rejected"
              ? "❌"
              : "⏳"
          }\n` +
          `🔹 *Reason for Verdict:* "${reasonForVerdict}"`;

        Logger.log(`✅ Leave status found: ${responseMessage}`);
        return responseMessage;
      }
    }

    return { error: `❌ Error: No leave request found with ID ${leaveID}` };
  } catch (error) {
    return { error: `🚨 Error retrieving leave status: ${error.message}` };
  }
}

// ✅ Test function
function testGetLeaveStatusV2() {
  let testLeaveID = "LID-1739770165"; // Replace with a real ID from the sheet
  Logger.log("🛠 Testing getLeaveStatusV2 with ID: " + testLeaveID);

  let response = getLeaveStatusV2(testLeaveID);

  Logger.log("📝 Response: " + JSON.stringify(response, null, 2));
}

// ✅ Test function
function testGetLeaveStatusV2() {
  let testLeaveID = "LID-1739770165"; // Replace with a real ID from the sheet
  Logger.log("🛠 Testing getLeaveStatusV2 with ID: " + testLeaveID);

  let response = getLeaveStatusV2(testLeaveID);

  Logger.log("📝 Response: " + JSON.stringify(response, null, 2));
}

// ✅ Test function
function testGetLeaveStatusV2() {
  let testLeaveID = "LID-1739002554"; // Replace with a real ID from the sheet
  Logger.log("🛠 Testing getLeaveStatusV2 with ID: " + testLeaveID);

  let response = getLeaveStatusV2(testLeaveID);

  Logger.log("📝 Response: " + JSON.stringify(response, null, 2));
}
