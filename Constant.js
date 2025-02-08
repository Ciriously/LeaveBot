// 📌 constants.gs - Stores all constants used in the script

// 🔹 Google Sheet Information
const SHEET_ID = "1VgfgmMhsN4e-KlKCvLtX2PxgNk6J7H0CruLu9Vr2J34";
const SHEET_NAME = "Leaves_request";

// 🔹 Slack Webhook URL (Fetched Securely from Script Properties)
const SLACK_WEBHOOK_URL =
  PropertiesService.getScriptProperties().getProperty("SLACK_WEBHOOK_URL");

// 🔹 Slack Parameter Keys
const PARAM_USER = "user_name";
const PARAM_TEXT = "text";

// 🔹 Regular Expression for Leave Request Validation
const LEAVE_REQUEST_REGEX =
  /^(\d{2}\/\d{2}\/\d{4})-(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s+"(.+?)"$/;
