// ✅ Function to send error logs to Slack
function logAndSendSlackError(message) {
  Logger.log(message);
  sendSlackLog(`🚨 *Error Log:*\n${message}`);
}

// ✅ Function to send logs to Slack Webhook
function sendSlackLog(message) {
  if (!SLACK_WEBHOOK_URL) {
    Logger.log("❌ Error: Slack Webhook URL not set in script properties.");
    return;
  }

  let payload = {
    text: message,
    username: "LeaveBot",
    icon_emoji: ":robot_face:",
  };

  let options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  };

  try {
    let response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
    Logger.log(`🛠 Slack Webhook Response: ${response.getContentText()}`);
  } catch (error) {
    Logger.log("❌ Failed to send log to Slack: " + error.message);
  }
}

// ✅ Function to process the leave request from Slack command data
function processLeaveRequest(slackCommandData) {
  try {
    if (!slackCommandData || typeof slackCommandData !== "string") {
      let errorMsg = "❌ Error: Invalid Slack command data.";
      logAndSendSlackError(errorMsg);
      return errorMsg;
    }

    let params = parseSlackData(slackCommandData);
    let userName = params[PARAM_USER] || "Unknown User";
    let text = params[PARAM_TEXT] || "";

    // 🔹 Log raw received text
    sendSlackLog(`📩 Raw Request Received from ${userName}:\n${text}`);

    // 🔹 Decode Slack's URL-encoded text
    text = decodeURIComponent(text).trim();

    // 🔹 Normalize spaces & remove extra line breaks
    text = text.replace(/\s+/g, " ").trim();

    sendSlackLog(`🔍 Decoded Leave Request Text:\n"${text}"`);

    // 🔹 Validate Input Format
    let match = text.match(LEAVE_REQUEST_REGEX);

    if (!match) {
      let formatError = `❌ Error: Incorrect leave request format. Received: "${text}"`;
      logAndSendSlackError(formatError);
      return `❌ Error: Incorrect format. Use: DD/MM/YYYY-DD/MM/YYYY <Comp Off Count> "Reason"`;
    }

    let [, fromDate, toDate, compOff, reason] = match;

    // 🛠 Generate a Unique Leave ID
    let epochTime = Math.floor(Date.now() / 1000);
    let leaveID = "LID-" + epochTime;
    let requestedDate = new Date(epochTime * 1000).toLocaleString();

    try {
      let sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

      // Batch data append to minimize timeout risk
      let newRow = [
        leaveID,
        requestedDate,
        userName,
        "",
        fromDate,
        toDate,
        reason,
        compOff,
      ];
      let dataToAppend = [newRow]; // Collect data in an array
      sheet
        .getRange(
          sheet.getLastRow() + 1,
          1,
          dataToAppend.length,
          dataToAppend[0].length
        )
        .setValues(dataToAppend);

      let successMessage =
        `✅ *Leave Request Submitted for ${userName}:*\n` +
        `📅 *From:* ${fromDate}\n` +
        `📅 *To:* ${toDate}\n` +
        `🔢 *Comp-Offs:* ${compOff}\n` +
        `📝 *Reason:* "${reason}"\n` +
        `🔑 *Leave ID:* ${leaveID}`;

      sendSlackLog(successMessage);
      return successMessage;
    } catch (error) {
      let sheetError = `🚨 Error: Could not save leave request - ${error.message}`;
      logAndSendSlackError(sheetError);
      return sheetError;
    }
  } catch (error) {
    let processingError = `🚨 Error processing leave request: ${error.message}`;
    logAndSendSlackError(processingError);
    return processingError;
  }
}

// ✅ Test function to simulate a Slack request
function testProcessLeaveRequest() {
  let slackData =
    "token=E2nVZxTfCjqMx1XGbpVdzMQD&team_id=T07SUG42H9C&team_domain=testing02workspace&channel_id=C07T3KY2B28&channel_name=project&user_id=U08BHUACMDZ&user_name=Aditya Mishra&command=%2Fleave_request&text=14%2F02%2F2025-15%2F02%2F2025+1+%22Valentine+day%22&api_app_id=A08BYGJ4C3F&is_enterprise_install=false";

  Logger.log("🛠 Testing with: " + slackData);
  sendSlackLog(
    "🛠 *Testing Leave Request Processing...*\n🔹 Test Data: _" + slackData + "_"
  );
  let response = processLeaveRequest(slackData);
  Logger.log("📝 Slack Response: " + response);
  sendSlackLog("📝 *Test Response:*\n" + response);
}
