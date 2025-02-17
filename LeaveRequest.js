/**
 * Main function to process leave requests received from Slack commands.
 * Validates the format, performs data checks, and stores requests in Google Sheets.
 */
function processLeaveRequest(slackCommandData) {
  try {
    if (!slackCommandData || typeof slackCommandData !== "string") {
      return logAndSendSlackError("❌ Error: Invalid Slack command data.");
    }

    // Use the optimized parseSlackData function
    let params = parseSlackData(slackCommandData);

    // Make sure we extract 'text' correctly
    let userName = params["user_name"] || "Unknown User"; // Ensure correct extraction
    let text = params["text"] || ""; // Ensure text is correctly assigned

    sendSlackLog(`📩 Raw Request Received from ${userName}:\n${text}`);
    text = decodeURIComponent(text).trim().replace(/\s+/g, " "); // Clean up extra spaces
    sendSlackLog(`🔍 Decoded Leave Request Text: "${text}"`);

    let match = text.match(LEAVE_REQUEST_REGEX);
    if (!match) {
      return logAndSendSlackError(
        `❌ Error: Incorrect leave request format. Received: "${text}"`
      );
    }

    let [, fromDate, toDate, compOff, reason] = match;

    if (!isValidDateFormat(fromDate) || !isValidDateFormat(toDate)) {
      return logAndSendSlackError(
        "❌ Error: Invalid date format. Use DD/MM/YYYY."
      );
    }

    if (!isValidDateRange(fromDate, toDate)) {
      return logAndSendSlackError(
        "❌ Error: 'From' date must be earlier than or equal to 'To' date."
      );
    }

    if (isNaN(compOff) || parseInt(compOff) <= 0) {
      return logAndSendSlackError(
        "❌ Error: Comp-Off count must be a positive number."
      );
    }

    if (!isFutureDate(fromDate) || !isFutureDate(toDate)) {
      return logAndSendSlackError("❌ Error: Dates must not be in the past.");
    }

    let epochTime = Math.floor(Date.now() / 1000);
    let leaveID = `LID-${epochTime}`;
    let requestedDate = new Date(epochTime * 1000).toLocaleString();

    let sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    let newRow = [
      [leaveID, requestedDate, userName, "", fromDate, toDate, reason, compOff],
    ];

    // Add retry logic with exponential backoff in case of timeouts
    let retryAttempts = 3;
    let success = false;
    while (retryAttempts > 0 && !success) {
      try {
        // Batch append the new row
        sheet
          .getRange(sheet.getLastRow() + 1, 1, newRow.length, newRow[0].length)
          .setValues(newRow);
        success = true; // If successful, exit loop
      } catch (error) {
        retryAttempts--;
        if (retryAttempts > 0) {
          let waitTime = Math.pow(2, 3 - retryAttempts) * 1000; // Exponential backoff
          Logger.log(`⏳ Retrying in ${waitTime / 1000} seconds...`);
          Utilities.sleep(waitTime);
        } else {
          return logAndSendSlackError(
            `❌ Error: Failed to add leave request after multiple attempts. ${error.message}`
          );
        }
      }
    }

    let successMessage =
      `✅ *Leave Request Submitted for ${userName}:*\n` +
      `📅 *From:* ${fromDate}\n📅 *To:* ${toDate}\n🔢 *Comp-Offs:* ${compOff}\n📝 *Reason:* "${reason}"\n🔑 *Leave ID:* ${leaveID}`;
    sendSlackLog(successMessage);
    return successMessage;
  } catch (error) {
    return logAndSendSlackError(
      `🚨 Error processing leave request: ${error.message}`
    );
  }
}

/**
 * Logs an error and sends it to Slack.
 * @param {string} errorMsg - The error message to log and send.
 */
function logAndSendSlackError(errorMsg) {
  Logger.log(`❌ ${errorMsg}`);
  sendSlackLog(errorMsg);
  return errorMsg;
}

/**
 * Sends a log message to Slack via an incoming webhook.
 * @param {string} message - The message to be sent to Slack.
 */
function sendSlackLog(message) {
  if (!message) return;

  var payload = { text: message };
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
    if (response.getResponseCode() !== 200) {
      Logger.log(`Slack Webhook Error: ${response.getResponseCode()}`);
    }
  } catch (error) {
    Logger.log(`Error sending message to Slack: ${error.message}`);
  }
}

// Test function for processing leave requests
function testProcessLeaveRequest() {
  Logger.log("🛠 Starting Leave Request Processing Tests...");
  sendSlackLog("🛠 Starting Leave Request Processing Tests...");

  let testCases = [
    {
      description: "✅ Valid Request",
      slackData:
        "token=E2nVZxTfCjqMx1XGbpVdzMQD&team_id=T07SUG42H9C&team_domain=testing02workspace&channel_id=C07T3KY2B28&channel_name=project&user_id=U08BHUACMDZ&user_name=Aditya Mishra&command=%2Fleave_request&text=25%2F02%2F2025-05%2F03%2F2025+2+%22Vacation%22&api_app_id=A08BYGJ4C3F&is_enterprise_install=false",
    },
    {
      description: "❌ Invalid Date Format",
      slackData:
        "token=E2nVZxTfCjqMx1XGbpVdzMQD&team_id=T07SUG42H9C&team_domain=testing02workspace&channel_id=C07T3KY2B28&channel_name=project&user_id=U08BHUACMDZ&user_name=Aditya Mishra&command=%2Fleave_request&text=2025-02-14-2025-02-15+1+%22Invalid+Date+Format%22&api_app_id=A08BYGJ4C3F&is_enterprise_install=false",
    },
    {
      description: "❌ 'From' Date After 'To' Date",
      slackData:
        "token=E2nVZxTfCjqMx1XGbpVdzMQD&team_id=T07SUG42H9C&team_domain=testing02workspace&channel_id=C07T3KY2B28&channel_name=project&user_id=U08BHUACMDZ&user_name=Aditya Mishra&command=%2Fleave_request&text=15%2F02%2F2025-14%2F02%2F2025+1+%22Reverse+Date%22&api_app_id=A08BYGJ4C3F&is_enterprise_install=false",
    },
    {
      description: "❌ Negative Comp-Off Count",
      slackData:
        "token=E2nVZxTfCjqMx1XGbpVdzMQD&team_id=T07SUG42H9C&team_domain=testing02workspace&channel_id=C07T3KY2B28&channel_name=project&user_id=U08BHUACMDZ&user_name=Aditya Mishra&command=%2Fleave_request&text=14%2F02%2F2025-15%2F02%2F2025+-1+%22Negative+Comp-Off%22&api_app_id=A08BYGJ4C3F&is_enterprise_install=false",
    },
    {
      description: "❌ Missing Required Fields",
      slackData:
        "token=E2nVZxTfCjqMx1XGbpVdzMQD&team_id=T07SUG42H9C&team_domain=testing02workspace&channel_id=C07T3KY2B28&channel_name=project&user_id=U08BHUACMDZ&user_name=Aditya Mishra&command=%2Fleave_request&text=14%2F02%2F2025-15%2F02%2F2025+&api_app_id=A08BYGJ4C3F&is_enterprise_install=false",
    },
    {
      description: "❌ Date in the Past",
      slackData:
        "token=E2nVZxTfCjqMx1XGbpVdzMQD&team_id=T07SUG42H9C&team_domain=testing02workspace&channel_id=C07T3KY2B28&channel_name=project&user_id=U08BHUACMDZ&user_name=Aditya Mishra&command=%2Fleave_request&text=01%2F01%2F2023-02%2F01%2F2023+1+%22Past+Leave%22&api_app_id=A08BYGJ4C3F&is_enterprise_install=false",
    },
  ];

  for (let testCase of testCases) {
    Logger.log(`🛠 Test: ${testCase.description}`);
    sendSlackLog(`🛠 *Running Test: ${testCase.description}*`);

    let response = processLeaveRequest(testCase.slackData);

    Logger.log(`📝 Test Result: ${response}`);
    sendSlackLog(`📝 *Test Result:* ${response}`);
  }

  Logger.log("✅ All tests completed.");
  sendSlackLog("✅ *All Leave Request Processing Tests Completed.*");
}
