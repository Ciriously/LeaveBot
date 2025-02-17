/**
 * Logs an error to the Google Apps Script Logger and sends the same error to Slack.
 * @param {string} errorMessage - The error message to log and send to Slack.
 */
function logAndSendSlackError(errorMessage) {
  Logger.log(`❌ ${errorMessage}`);

  // Ensure SLACK_WEBHOOK_URL is set correctly in your constants
  const webhookUrl = SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    Logger.log("⚠️ SLACK_WEBHOOK_URL is not defined.");
    return;
  }

  const payload = {
    text: `❌ Error Notification:\n${errorMessage}`,
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  };

  try {
    UrlFetchApp.fetch(webhookUrl, options);
  } catch (fetchError) {
    Logger.log(
      `⚠️ Failed to send error notification to Slack: ${fetchError.message}`
    );
  }
}
