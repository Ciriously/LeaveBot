function getLeaveStatusV2(leaveID) {
  try {
    // Use cache to store sheet data for a short period (5 minutes)
    let cache = CacheService.getScriptCache();
    let cachedData = cache.get("leave_data");

    let data;
    if (cachedData) {
      // If cached data is available, parse it
      data = JSON.parse(cachedData);
    } else {
      // Open the Google Sheet and get data only from relevant columns
      let sheet = SpreadsheetApp.openById(
        "1VgfgmMhsN4e-KlKCvLtX2PxgNk6J7H0CruLu9Vr2J34"
      ).getSheetByName("Leaves_request");
      if (!sheet) {
        return { error: "❌ Error: 'Leaves_request' sheet not found." };
      }

      data = sheet.getDataRange().getValues(); // Fetch all data
      if (data.length < 2) {
        return { error: "❌ Error: No leave requests found." };
      }

      // Cache the data for 5 minutes to avoid fetching it repeatedly
      cache.put("leave_data", JSON.stringify(data), 150); // Cache data for 5 minutes
    }

    let headers = data[0].map((header) => header.trim().toLowerCase());

    let leaveIDColumn = headers.indexOf("request id");
    let statusColumn = headers.indexOf("recommendation");
    let verdictColumn = headers.indexOf("reason for verdict");

    if (leaveIDColumn === -1 || statusColumn === -1) {
      Logger.log(
        `❌ Error: Required columns not found. Found headers: ${JSON.stringify(
          headers
        )}`
      );
      return { error: "❌ Error: Required columns not found in the sheet." };
    }

    // Search for the leave request
    for (let i = 1; i < data.length; i++) {
      if (data[i][leaveIDColumn] === leaveID) {
        let recommendation = data[i][statusColumn] || "Pending";
        let reasonForVerdict =
          verdictColumn !== -1 && data[i][verdictColumn]
            ? data[i][verdictColumn]
            : "Not Provided";

        // Construct response with emojis
        let responseMessage =
          `✅ *Leave Status for Request ID: ${leaveID}*\n` +
          `🔹 *Recommendation:* ${recommendation} ${
            recommendation === "Approved"
              ? "✔️"
              : recommendation === "Rejected"
              ? "❌"
              : "⏳"
          }\n` +
          `🔹 *Reason for Verdict:* "${reasonForVerdict}"`;

        Logger.log(`✅ Leave status found: ${responseMessage}`);
        return responseMessage;
      }
    }

    return { error: `❌ Error: No leave request found with ID *${leaveID}*` };
  } catch (error) {
    return { error: `🚨 Error retrieving leave status: ${error.message}` };
  }
}

// ✅ Test function
function testGetLeaveStatusV2() {
  let testLeaveID = "LID-1738999057"; // Replace with a real ID from the sheet
  Logger.log("🛠 Testing getLeaveStatusV2 with ID: " + testLeaveID);

  let response = getLeaveStatusV2(testLeaveID);

  Logger.log("📝 Response: " + JSON.stringify(response, null, 2));
}
