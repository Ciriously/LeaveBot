// doPost Function
function doPost(e) {
  try {
    if (!e?.postData?.contents) {
      throw new Error("Invalid request: No post data received.");
    }

    let params = parseSlackData(e.postData.contents);
    let { command, text = "" } = params;

    Logger.log(`📩 Received Slack Command: ${command}, Text: ${text}`);

    const commandHandlers = {
      "/leave_request": () => processLeaveRequest(e.postData.contents),
      "/leave_status": () => getLeaveStatusV2(text),
      "/leave_cancel": () => cancelLeaveRequest(text),
    };

    let response = commandHandlers[command]
      ? commandHandlers[command]()
      : { error: `❌ ERROR: Invalid command received - ${command}` };

    if (!commandHandlers[command]) {
      // Log Slack error in case of an invalid command
      logAndSendSlackError(response.error);
    }

    // 🛠️ Convert Object to String if it's an object (Fix for [object Object] issue)
    let responseMessage =
      typeof response === "object"
        ? JSON.stringify(response, null, 2)
        : response;

    return ContentService.createTextOutput(responseMessage).setMimeType(
      ContentService.MimeType.TEXT
    );
  } catch (error) {
    let errorMessage = `🚨 Error in doPost: ${error.message}`;
    // Log and send the error message to Slack only once
    logAndSendSlackError(errorMessage);
    return ContentService.createTextOutput(errorMessage).setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}

// ✅ Test Function for `doPost`
function testDoPost() {
  let testRequests = [
    {
      description: "✅ Testing `/leave_request`",
      event: {
        postData: {
          contents:
            "command=%2Fleave_request&text=20%2F11%2F2025-25%2F11%2F2025+3+%22Exam+Leave%22",
        },
      },
    },
    {
      description: "✅ Testing `/leave_status`",
      event: {
        postData: {
          contents: "command=%2Fleave_status&text=LID-1739014881",
        },
      },
    },
    {
      description: "✅ Testing `/leave_cancel` with Reason",
      event: {
        postData: {
          contents:
            "command=%2Fleave_cancel&text=LID-1739772626+Reason+for+cancel+%22Personal+Issue%22",
        },
      },
    },
    {
      description: "❌ Testing Invalid Command",
      event: {
        postData: {
          contents: "command=%2Finvalid_command&text=some+random+text",
        },
      },
    },
  ];

  testRequests.forEach((test) => {
    Logger.log(test.description);
    let response = doPost(test.event);
    Logger.log("📝 Response: " + response.getContent());
  });
}
