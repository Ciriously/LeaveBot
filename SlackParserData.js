// ✅ Optimized Function to Parse Slack Data (Fast & Efficient)
function parseSlackData(slackCommandData) {
  if (!slackCommandData || typeof slackCommandData !== "string") {
    Logger.log("❌ Error: Invalid Slack command data.");
    return {};
  }

  Logger.log("📩 Raw Slack Data: " + slackCommandData);

  let parsedData = Object.fromEntries(
    slackCommandData
      .split("&")
      .map((pair) => pair.split("=").map(decodeURIComponent)) // ✅ Decode keys & values
      .map(([key, value = ""]) => [
        key.trim(),
        value.replace(/\+/g, " ").trim(),
      ]) // ✅ Trim & replace "+"
  );

  Logger.log("🔍 Parsed Slack Data (Optimized): " + JSON.stringify(parsedData));
  return parsedData;
}

// ✅ Test Function for `parseSlackData`
function testParseSlackData() {
  let testSlackData =
    "user_name=Aditya+Mishra&command=%2Fleave_request&text=20%2F11%2F2025-25%2F11%2F2025+3+%22Exam+Leave%22";

  Logger.log("🛠 Testing `parseSlackData` with input: " + testSlackData);

  let parsedResult = parseSlackData(testSlackData);

  Logger.log("📝 Test Output: " + JSON.stringify(parsedResult, null, 2));
}
