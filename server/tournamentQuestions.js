// CYBERNAUTS CODE HUNT — ROUND 2 (CHAMPIONSHIP DUELS)
// Official Question Bank: 15 Case Study Duels x 3 Questions = 45 Questions
// Scoring: Exactly one of (+3000, +1500, 0, -2000, -4000) per question.

const DUEL_SETS = [
  {
    duelNumber: 1,
    title: "The Demo That Won't Cooperate",
    caseStudy: "Your team is presenting a small app in 20 minutes. The app works on two laptops, but on the presentation laptop one button sometimes needs a second click. You also have a tiny alignment issue in the header.",
    mission: "You have only enough time to make one focused improvement before a full rehearsal.",
    questions: [
      {
        id: 1,
        questionNumber: 1,
        question: "What should the team investigate first?",
        options: [
          { text: "Restart the laptop and assume the issue will disappear.", outcome: "neutral" },
          { text: "Reproduce the double-click issue on the presentation laptop and inspect the button handler.", outcome: "best" },
          { text: "Fix the header alignment because it is visible to the audience.", outcome: "less_good" },
          { text: "Rewrite the whole page so both issues are addressed together.", outcome: "less_bad" },
          { text: "Ignore the button issue and practice only the opening slide.", outcome: "worst" },
        ],
        explanation: "Reproduce the double-click issue on the presentation laptop and inspect the button handler (+3,000)."
      },
      {
        id: 2,
        questionNumber: 2,
        question: "You reproduce the bug twice. It happens only after the page is refreshed. What is the most useful next move?",
        options: [
          { text: "Ask the audience in advance whether a second click is acceptable.", outcome: "less_good" },
          { text: "Change the button colour and test again.", outcome: "worst" },
          { text: "Remove the refresh behaviour from the demo.", outcome: "less_bad" },
          { text: "Inspect how the button state is initialized after refresh.", outcome: "best" },
          { text: "Replace the button text with shorter text.", outcome: "neutral" },
        ],
        explanation: "Inspect how the button state is initialized after refresh (+3,000)."
      },
      {
        id: 3,
        questionNumber: 3,
        question: "You find a one-line initialization fix. What should you do before calling it finished?",
        options: [
          { text: "Wait for another teammate to discover a problem during the live presentation.", outcome: "less_good" },
          { text: "Skip the test because the line is obviously correct.", outcome: "neutral" },
          { text: "Rewrite the surrounding component for cleaner code.", outcome: "less_bad" },
          { text: "Apply the small fix and run the critical demo flow end-to-end once.", outcome: "best" },
          { text: "Add a second unrelated improvement while you are already editing the file.", outcome: "worst" },
        ],
        explanation: "Apply the small fix and run the critical demo flow end-to-end once (+3,000)."
      }
    ]
  },
  {
    duelNumber: 2,
    title: "The Event Mic Problem",
    caseStudy: "Your society event starts in 15 minutes. One wireless microphone works, but the second microphone cuts out whenever the speaker moves more than a few metres from the receiver. The audience is already entering.",
    mission: "Decide what to do so the event starts smoothly without spending all the remaining time troubleshooting.",
    questions: [
      {
        id: 4,
        questionNumber: 1,
        question: "What is the best first response?",
        options: [
          { text: "Start the event and troubleshoot while the speaker is talking.", outcome: "neutral" },
          { text: "Cancel the speaker segment until the mic is perfect.", outcome: "less_good" },
          { text: "Use the working microphone as the primary mic and quickly test the backup path.", outcome: "best" },
          { text: "Spend the full 15 minutes trying to repair the faulty wireless mic.", outcome: "less_bad" },
          { text: "Increase the faulty mic's volume to compensate.", outcome: "worst" },
        ],
        explanation: "Use the working microphone as the primary mic and quickly test the backup path (+3,000)."
      },
      {
        id: 5,
        questionNumber: 2,
        question: "You discover the working microphone has a loose cable at the mixer. What should you do?",
        options: [
          { text: "Move the cable repeatedly until it happens to work.", outcome: "less_bad" },
          { text: "Leave it because the mic is still producing sound.", outcome: "worst" },
          { text: "Switch all microphones off and start the event without audio.", outcome: "neutral" },
          { text: "Increase the mixer gain instead of fixing the connection.", outcome: "less_good" },
          { text: "Secure or replace the cable and test the complete audio chain once.", outcome: "best" },
        ],
        explanation: "Secure or replace the cable and test the complete audio chain once (+3,000)."
      },
      {
        id: 6,
        questionNumber: 3,
        question: "The backup setup works, but only after a 20-second test. What is the most sensible plan?",
        options: [
          { text: "Change the stage layout completely to hide the problem.", outcome: "neutral" },
          { text: "Avoid using any microphone so nothing can fail.", outcome: "less_bad" },
          { text: "Keep both microphones active and hope the faulty one stays connected.", outcome: "worst" },
          { text: "Continue diagnosing the faulty mic during the first speech.", outcome: "less_good" },
          { text: "Use the tested backup setup and keep the faulty mic out of the critical path.", outcome: "best" },
        ],
        explanation: "Use the tested backup setup and keep the faulty mic out of the critical path (+3,000)."
      }
    ]
  },
  {
    duelNumber: 3,
    title: "The Suspicious Scholarship Link",
    caseStudy: "A student receives a message saying: 'Your scholarship account will be blocked today. Verify immediately.' The link looks almost like the official portal, but one character in the domain is different.",
    mission: "Protect the account while keeping the situation moving quickly.",
    questions: [
      {
        id: 7,
        questionNumber: 1,
        question: "What should the student do first?",
        options: [
          { text: "Enter the password quickly because the message says it is urgent.", outcome: "neutral" },
          { text: "Open the official portal independently instead of using the message link.", outcome: "best" },
          { text: "Open the link but stop before entering the password.", outcome: "worst" },
          { text: "Reply to the sender asking whether the message is genuine.", outcome: "less_bad" },
          { text: "Forward the message to the entire class so others can compare it.", outcome: "less_good" },
        ],
        explanation: "Open the official portal independently instead of using the message link (+3,000)."
      },
      {
        id: 8,
        questionNumber: 2,
        question: "The official portal shows no warning about a blocked account. What is the strongest next conclusion?",
        options: [
          { text: "Try the suspicious link again from another browser.", outcome: "worst" },
          { text: "Ignore the difference in the domain because the page looks professional.", outcome: "less_good" },
          { text: "Treat the message as suspicious and report it through the official channel.", outcome: "best" },
          { text: "Assume the portal is simply slow to update.", outcome: "less_bad" },
          { text: "Use a friend's phone to open the link.", outcome: "neutral" },
        ],
        explanation: "Treat the message as suspicious and report it through the official channel (+3,000)."
      },
      {
        id: 9,
        questionNumber: 3,
        question: "The student already entered the password on the suspicious page. What should happen now?",
        options: [
          { text: "Close the tab and wait for something unusual to happen.", outcome: "neutral" },
          { text: "Change the password through the real portal and report the incident.", outcome: "best" },
          { text: "Post the password problem publicly so someone can help.", outcome: "worst" },
          { text: "Keep the same password because changing it may cause confusion.", outcome: "less_bad" },
          { text: "Try the same password again to see whether it still works.", outcome: "less_good" },
        ],
        explanation: "Change the password through the real portal and report the incident (+3,000)."
      }
    ]
  },
  {
    duelNumber: 4,
    title: "The Shared Folder Mix-Up",
    caseStudy: "Four team members are editing event files. Two copies of 'final_poster' exist, one is missing the sponsor logo, and nobody is sure which copy was last approved.",
    mission: "Choose actions that restore one reliable source of truth without accidentally losing work.",
    questions: [
      {
        id: 10,
        questionNumber: 1,
        question: "What should the team establish first?",
        options: [
          { text: "Use the file with the largest size because it probably contains more work.", outcome: "worst" },
          { text: "Which copy is the approved version and where the authoritative source is stored.", outcome: "best" },
          { text: "Delete all copies and recreate the poster.", outcome: "less_bad" },
          { text: "Which file has the newer-looking filename.", outcome: "neutral" },
          { text: "Which person edited a file most recently.", outcome: "less_good" },
        ],
        explanation: "Which copy is the approved version and where the authoritative source is stored (+3,000)."
      },
      {
        id: 11,
        questionNumber: 2,
        question: "You discover the approved copy is older than the copy with the sponsor logo. What is the safest next step?",
        options: [
          { text: "Keep both and let the printer choose.", outcome: "neutral" },
          { text: "Rename both files again and continue editing.", outcome: "less_good" },
          { text: "Compare the two versions and merge the sponsor logo into the approved copy deliberately.", outcome: "best" },
          { text: "Delete the older copy immediately.", outcome: "less_bad" },
          { text: "Replace the approved copy with the newer file without checking the differences.", outcome: "worst" },
        ],
        explanation: "Compare the two versions and merge the sponsor logo into the approved copy deliberately (+3,000)."
      },
      {
        id: 12,
        questionNumber: 3,
        question: "After merging the changes, what should the team do?",
        options: [
          { text: "Assume the merge worked because the file opens.", outcome: "neutral" },
          { text: "Ask a teammate to guess whether the sponsor logo is correct.", outcome: "less_bad" },
          { text: "Make another major design change before checking the merged version.", outcome: "less_good" },
          { text: "Open the final file and verify the critical elements before sharing it.", outcome: "best" },
          { text: "Send it immediately and fix any issue after printing.", outcome: "worst" },
        ],
        explanation: "Open the final file and verify the critical elements before sharing it (+3,000)."
      }
    ]
  },
  {
    duelNumber: 5,
    title: "The Last-Minute Presentation",
    caseStudy: "Your team has a five-minute class presentation. The content is finished, but one teammate wants to add a new animation, another wants to rehearse, and the title slide has a small formatting issue.",
    mission: "Use the last few minutes to reduce the chance of an embarrassing failure.",
    questions: [
      {
        id: 13,
        questionNumber: 1,
        question: "What should the team prioritize?",
        options: [
          { text: "Add the new animation because it may impress the class.", outcome: "less_good" },
          { text: "Rehearse the actual presentation flow and fix anything that could stop it.", outcome: "best" },
          { text: "Start rewriting the introduction from scratch.", outcome: "neutral" },
          { text: "Perfect the title slide before practicing.", outcome: "worst" },
          { text: "Split into separate tasks without deciding what matters most.", outcome: "less_bad" },
        ],
        explanation: "Rehearse the actual presentation flow and fix anything that could stop it (+3,000)."
      },
      {
        id: 14,
        questionNumber: 2,
        question: "During rehearsal, the video does not play once. What should you do?",
        options: [
          { text: "Add another video so there is more content.", outcome: "less_good" },
          { text: "Test the video again and prepare a simple backup such as a screenshot or alternate clip.", outcome: "best" },
          { text: "Ignore it because the video worked earlier.", outcome: "less_bad" },
          { text: "Remove the whole presentation and start again.", outcome: "neutral" },
          { text: "Continue rehearsing without checking the cause.", outcome: "worst" },
        ],
        explanation: "Test the video again and prepare a simple backup such as a screenshot or alternate clip (+3,000)."
      },
      {
        id: 15,
        questionNumber: 3,
        question: "The backup works, but the team has only 30 seconds left. What is the best choice?",
        options: [
          { text: "Try one more new video because it might be better.", outcome: "neutral" },
          { text: "Change slide transitions at the last moment.", outcome: "less_bad" },
          { text: "Restart the presentation file again.", outcome: "worst" },
          { text: "Use the tested backup and avoid making further changes.", outcome: "best" },
          { text: "Add extra content so the presentation feels fuller.", outcome: "less_good" },
        ],
        explanation: "Use the tested backup and avoid making further changes (+3,000)."
      }
    ]
  },
  {
    duelNumber: 6,
    title: "The QR Clue Trail",
    caseStudy: "At a campus game station, your team scans a QR code and gets three clues: BLUE → LIBRARY → 3. A board shows five coloured boxes near the library: blue, red, green, yellow and black.",
    mission: "Follow the clues exactly and avoid adding assumptions that are not in the puzzle.",
    questions: [
      {
        id: 16,
        questionNumber: 1,
        question: "What should the first step be?",
        options: [
          { text: "Choose the box closest to the library entrance.", outcome: "less_bad" },
          { text: "Ask another team which box they used.", outcome: "less_good" },
          { text: "Choose the most brightly coloured box.", outcome: "neutral" },
          { text: "Pick a box randomly because the clue is too short.", outcome: "worst" },
          { text: "Use the word BLUE to identify the blue box.", outcome: "best" },
        ],
        explanation: "Use the word BLUE to identify the blue box (+3,000)."
      },
      {
        id: 17,
        questionNumber: 2,
        question: "The blue box contains three cards labelled 1, 2 and 3. What should the team do with the clue '3'?",
        options: [
          { text: "Select card 2 because it is in the middle.", outcome: "worst" },
          { text: "Choose whichever card is easiest to reach.", outcome: "less_bad" },
          { text: "Select card 1 because it is the first card.", outcome: "less_good" },
          { text: "Ignore the number because colour was the main clue.", outcome: "neutral" },
          { text: "Select card 3 because it directly matches the supplied clue.", outcome: "best" },
        ],
        explanation: "Select card 3 because it directly matches the supplied clue (+3,000)."
      },
      {
        id: 18,
        questionNumber: 3,
        question: "Card 3 says: 'RETURN THE TOKEN TO THE LIBRARY DESK.' What is the best next action?",
        options: [
          { text: "Move the token somewhere else so the next clue is harder.", outcome: "neutral" },
          { text: "Take a photo and continue without the token.", outcome: "worst" },
          { text: "Take the token to the library desk as instructed.", outcome: "best" },
          { text: "Leave the token at the blue box for another team.", outcome: "less_bad" },
          { text: "Ask the volunteer whether the instruction really matters.", outcome: "less_good" },
        ],
        explanation: "Take the token to the library desk as instructed (+3,000)."
      }
    ]
  },
  {
    duelNumber: 7,
    title: "Wi-Fi Down, Event Still On",
    caseStudy: "During the event, several teams cannot load the CodeHunt website. Two organizers on a different network can still use it. The venue Wi-Fi is the only thing shared by the affected teams.",
    mission: "Diagnose the likely scope of the problem before changing the application.",
    questions: [
      {
        id: 19,
        questionNumber: 1,
        question: "What is the most useful first check?",
        options: [
          { text: "Disable all security settings on the venue network.", outcome: "less_bad" },
          { text: "Ask every participant to restart their phone.", outcome: "worst" },
          { text: "Compare an affected device with a working device and check whether they share the same network.", outcome: "best" },
          { text: "Rewrite the website because users cannot load it.", outcome: "neutral" },
          { text: "Restart the entire application server immediately.", outcome: "less_good" },
        ],
        explanation: "Compare an affected device with a working device and check whether they share the same network (+3,000)."
      },
      {
        id: 20,
        questionNumber: 2,
        question: "You confirm all affected teams are on the same Wi-Fi. What does that evidence suggest?",
        options: [
          { text: "Assume every affected phone has a separate hardware fault.", outcome: "worst" },
          { text: "Rebuild the website from scratch.", outcome: "less_good" },
          { text: "Turn off the working network too so every device behaves the same.", outcome: "neutral" },
          { text: "Ignore the pattern because the website works somewhere else.", outcome: "less_bad" },
          { text: "Investigate the shared network path before changing the application.", outcome: "best" },
        ],
        explanation: "Investigate the shared network path before changing the application (+3,000)."
      },
      {
        id: 21,
        questionNumber: 3,
        question: "A backup hotspot works for the organizers but is slower. What is the best event response?",
        options: [
          { text: "Stop the event because the main Wi-Fi is unavailable.", outcome: "worst" },
          { text: "Use the tested backup for critical operations while the Wi-Fi problem is addressed.", outcome: "best" },
          { text: "Disable the hotspot because it is slower.", outcome: "less_good" },
          { text: "Change application code to compensate for a network issue.", outcome: "less_bad" },
          { text: "Keep retrying the broken Wi-Fi until it recovers.", outcome: "neutral" },
        ],
        explanation: "Use the tested backup for critical operations while the Wi-Fi problem is addressed (+3,000)."
      }
    ]
  },
  {
    duelNumber: 8,
    title: "The Duplicate Registration",
    caseStudy: "Your registration sheet has two very similar names, one missing team number, and one participant who appears under a shortened nickname in another row.",
    mission: "Clean the data without accidentally merging two different participants.",
    questions: [
      {
        id: 22,
        questionNumber: 1,
        question: "Before merging two similar names, what should you check?",
        options: [
          { text: "Merge them automatically because duplicates are common.", outcome: "worst" },
          { text: "Which teammate recognizes the name.", outcome: "less_good" },
          { text: "A reliable identifier such as registration ID or roll number.", outcome: "best" },
          { text: "Which row appears first.", outcome: "neutral" },
          { text: "Which name looks more complete.", outcome: "less_bad" },
        ],
        explanation: "A reliable identifier such as registration ID or roll number (+3,000)."
      },
      {
        id: 23,
        questionNumber: 2,
        question: "How should the missing team number be filled?",
        options: [
          { text: "Use the most common team number in the sheet.", outcome: "worst" },
          { text: "Cross-check the official team roster.", outcome: "best" },
          { text: "Copy the number from the row above.", outcome: "neutral" },
          { text: "Choose a temporary number at random.", outcome: "less_bad" },
          { text: "Delete the participant until they report the issue.", outcome: "less_good" },
        ],
        explanation: "Cross-check the official team roster (+3,000)."
      },
      {
        id: 24,
        questionNumber: 3,
        question: "Two rows share the same team number but different registration IDs. What should you conclude?",
        options: [
          { text: "Change both registration IDs until they match.", outcome: "neutral" },
          { text: "They must be the same person because the team number matches.", outcome: "worst" },
          { text: "Merge them because duplicate names are expected.", outcome: "less_good" },
          { text: "They should remain separate participants unless other reliable evidence proves otherwise.", outcome: "best" },
          { text: "Delete the newer row.", outcome: "less_bad" },
        ],
        explanation: "They should remain separate participants unless other reliable evidence proves otherwise (+3,000)."
      }
    ]
  },
  {
    duelNumber: 9,
    title: "The Team That Cannot Agree",
    caseStudy: "Your three-person team has two plausible answers to a clue. One teammate is strongly convinced by option A, another by option B, while the third has found a clue that seems to favour one interpretation.",
    mission: "Resolve disagreement using evidence instead of confidence or volume.",
    questions: [
      {
        id: 25,
        questionNumber: 1,
        question: "What should the team do first?",
        options: [
          { text: "Ask another team for their answer.", outcome: "less_good" },
          { text: "Vote immediately so the discussion ends.", outcome: "less_bad" },
          { text: "Follow the most confident teammate.", outcome: "neutral" },
          { text: "Compare the specific clue that can distinguish the two candidate answers.", outcome: "best" },
          { text: "Choose the answer that appeared first.", outcome: "worst" },
        ],
        explanation: "Compare the specific clue that can distinguish the two candidate answers (+3,000)."
      },
      {
        id: 26,
        questionNumber: 2,
        question: "The third teammate points out that one candidate violates a clear condition in the clue. What should happen?",
        options: [
          { text: "Ask the organizer which answer looks nicer.", outcome: "worst" },
          { text: "Use that condition to eliminate the candidate that violates it.", outcome: "best" },
          { text: "Choose the candidate with the shorter name.", outcome: "neutral" },
          { text: "Keep both candidates because disagreement is still possible.", outcome: "less_bad" },
          { text: "Ignore the condition because two people liked the candidate.", outcome: "less_good" },
        ],
        explanation: "Use that condition to eliminate the candidate that violates it (+3,000)."
      },
      {
        id: 27,
        questionNumber: 3,
        question: "There are five seconds left and the evidence now supports one option clearly. What should the team do?",
        options: [
          { text: "Wait until the timer expires.", outcome: "less_good" },
          { text: "Submit the evidence-supported option immediately.", outcome: "best" },
          { text: "Switch to the other option to be safer.", outcome: "neutral" },
          { text: "Ask another team for a final vote.", outcome: "worst" },
          { text: "Restart the whole discussion.", outcome: "less_bad" },
        ],
        explanation: "Submit the evidence-supported option immediately (+3,000)."
      }
    ]
  },
  {
    duelNumber: 10,
    title: "The Version-Control Conflict",
    caseStudy: "Two teammates edited the same code file. When the changes are combined, a conflict appears. Both edits look sensible, but they affect the same function.",
    mission: "Resolve the conflict while preserving the intended behaviour of both changes.",
    questions: [
      {
        id: 28,
        questionNumber: 1,
        question: "What should you inspect before deciding what to keep?",
        options: [
          { text: "Which change contains more lines.", outcome: "less_good" },
          { text: "The surrounding code and what each change is intended to accomplish.", outcome: "best" },
          { text: "Which teammate edited the file later.", outcome: "neutral" },
          { text: "Which version looks more complicated.", outcome: "worst" },
          { text: "Delete both edits and restore yesterday's file.", outcome: "less_bad" },
        ],
        explanation: "The surrounding code and what each change is intended to accomplish (+3,000)."
      },
      {
        id: 29,
        questionNumber: 2,
        question: "You combine the changes and the project still starts. What should happen next?",
        options: [
          { text: "Change the function again so the conflict cannot return.", outcome: "less_bad" },
          { text: "Wait until the final event to test it.", outcome: "neutral" },
          { text: "Commit immediately because the application opens.", outcome: "worst" },
          { text: "Ask the teammate whether it feels correct.", outcome: "less_good" },
          { text: "Run the relevant test or critical flow before calling the merge complete.", outcome: "best" },
        ],
        explanation: "Run the relevant test or critical flow before calling the merge complete (+3,000)."
      },
      {
        id: 30,
        questionNumber: 3,
        question: "A test fails after the merge, but the same test passed before. What is the best response?",
        options: [
          { text: "Revert everything without checking what changed.", outcome: "worst" },
          { text: "Use the failing test to isolate whether the merge introduced a regression.", outcome: "best" },
          { text: "Delete the merged function immediately.", outcome: "less_good" },
          { text: "Ignore it because the rest of the app works.", outcome: "neutral" },
          { text: "Change the test so it passes.", outcome: "less_bad" },
        ],
        explanation: "Use the failing test to isolate whether the merge introduced a regression (+3,000)."
      }
    ]
  },
  {
    duelNumber: 11,
    title: "The Registration Desk Queue",
    caseStudy: "At event check-in, ten students arrive together. One volunteer is checking IDs and another is assigning team numbers. People are getting confused because some are being served out of order.",
    mission: "Choose a simple process that keeps the line fair and easy to manage.",
    questions: [
      {
        id: 31,
        questionNumber: 1,
        question: "What process should the volunteers use?",
        options: [
          { text: "Let people move forward when they are in a hurry.", outcome: "less_bad" },
          { text: "Serve students in the order they arrived unless there is a clearly announced priority rule.", outcome: "best" },
          { text: "Serve whoever the volunteer recognizes first.", outcome: "worst" },
          { text: "Serve the loudest group first.", outcome: "neutral" },
          { text: "Ask students to form several random mini-lines.", outcome: "less_good" },
        ],
        explanation: "Serve students in the order they arrived unless there is a clearly announced priority rule (+3,000)."
      },
      {
        id: 32,
        questionNumber: 2,
        question: "A student has all documents ready while the person ahead is still completing a form. What is the best approach?",
        options: [
          { text: "Ignore the queue and let everyone choose their position.", outcome: "neutral" },
          { text: "Create a new line for only prepared students without informing anyone.", outcome: "less_good" },
          { text: "Keep the student in the main order and use a second volunteer to help with paperwork if possible.", outcome: "best" },
          { text: "Move the ready student to the front automatically.", outcome: "less_bad" },
          { text: "Send the student to the back.", outcome: "worst" },
        ],
        explanation: "Keep the student in the main order and use a second volunteer to help with paperwork if possible (+3,000)."
      },
      {
        id: 33,
        questionNumber: 3,
        question: "The queue is getting long. What change helps most without making the process unfair?",
        options: [
          { text: "Let students skip steps that look unimportant.", outcome: "neutral" },
          { text: "Allow students to assign their own team numbers.", outcome: "less_good" },
          { text: "Ask one volunteer to do everything to keep one consistent line.", outcome: "worst" },
          { text: "Give each volunteer a clear role so ID checking and team assignment happen smoothly in parallel.", outcome: "best" },
          { text: "Stop checking IDs temporarily.", outcome: "less_bad" },
        ],
        explanation: "Give each volunteer a clear role so ID checking and team assignment happen smoothly in parallel (+3,000)."
      }
    ]
  },
  {
    duelNumber: 12,
    title: "The Missing Pen Drive",
    caseStudy: "A presentation pen drive is missing 25 minutes before class. The team has a laptop with the latest file open, but nobody knows whether the pen drive contains a newer version.",
    mission: "Recover the presentation without accidentally overwriting the best version.",
    questions: [
      {
        id: 34,
        questionNumber: 1,
        question: "What should the team do first?",
        options: [
          { text: "Delete the laptop copy so there is only one source.", outcome: "less_good" },
          { text: "Compare the open laptop version with any known recent copy or cloud backup.", outcome: "best" },
          { text: "Create a new presentation from scratch.", outcome: "worst" },
          { text: "Assume the pen drive had the newest version.", outcome: "neutral" },
          { text: "Ask a classmate to recreate the slides.", outcome: "less_bad" },
        ],
        explanation: "Compare the open laptop version with any known recent copy or cloud backup (+3,000)."
      },
      {
        id: 35,
        questionNumber: 2,
        question: "A cloud copy is timestamped 10 minutes earlier than the laptop file. What does that tell you?",
        options: [
          { text: "The cloud copy must be the correct one because it is online.", outcome: "less_bad" },
          { text: "Delete the cloud copy to avoid confusion.", outcome: "worst" },
          { text: "The laptop file must be wrong because its timestamp is later.", outcome: "less_good" },
          { text: "The laptop copy may be newer, but you should compare the actual changes before deciding.", outcome: "best" },
          { text: "Use whichever file has more slides.", outcome: "neutral" },
        ],
        explanation: "The laptop copy may be newer, but you should compare the actual changes before deciding (+3,000)."
      },
      {
        id: 36,
        questionNumber: 3,
        question: "You compare both and confirm the laptop has all the latest content. What is the best next move?",
        options: [
          { text: "Keep searching for the pen drive even if it risks making you late.", outcome: "less_bad" },
          { text: "Use the missing pen drive as the only backup plan.", outcome: "less_good" },
          { text: "Start editing the verified file again to make a fresh version.", outcome: "neutral" },
          { text: "Replace the laptop copy with the older cloud version.", outcome: "worst" },
          { text: "Save/export a second backup and present from the verified laptop copy.", outcome: "best" },
        ],
        explanation: "Save/export a second backup and present from the verified laptop copy (+3,000)."
      }
    ]
  },
  {
    duelNumber: 13,
    title: "The Simple Code Decision",
    caseStudy: "A first-year team is asked to choose between two ways to search a list. The list is already sorted, and they need to find one name quickly during a timed task.",
    mission: "Choose the approach that matches the information already available.",
    questions: [
      {
        id: 37,
        questionNumber: 1,
        question: "Which approach is the natural fit for a sorted list?",
        options: [
          { text: "Delete half the list randomly.", outcome: "neutral" },
          { text: "Shuffle the list first.", outcome: "worst" },
          { text: "Reverse the list and then scan it.", outcome: "less_bad" },
          { text: "Scan every item from the beginning every time.", outcome: "less_good" },
          { text: "Binary search.", outcome: "best" },
        ],
        explanation: "Binary search (+3,000)."
      },
      {
        id: 38,
        questionNumber: 2,
        question: "The team now has an unsorted list. What should they recognize?",
        options: [
          { text: "Binary search will work exactly the same.", outcome: "neutral" },
          { text: "The target must be at the end.", outcome: "worst" },
          { text: "The list should be shuffled again.", outcome: "less_good" },
          { text: "The search problem disappears.", outcome: "less_bad" },
          { text: "Binary search no longer directly applies unless the list is sorted first.", outcome: "best" },
        ],
        explanation: "Binary search no longer directly applies unless the list is sorted first (+3,000)."
      },
      {
        id: 39,
        questionNumber: 3,
        question: "The list is small—only 12 names—and the team has very little implementation time. What is a reasonable choice?",
        options: [
          { text: "Sort the list three times before searching.", outcome: "worst" },
          { text: "Use a simple linear scan if sorting is not otherwise needed.", outcome: "best" },
          { text: "Use a random search order.", outcome: "less_good" },
          { text: "Always implement binary search because it sounds faster.", outcome: "less_bad" },
          { text: "Build a database for the 12 names.", outcome: "neutral" },
        ],
        explanation: "Use a simple linear scan if sorting is not otherwise needed (+3,000)."
      }
    ]
  },
  {
    duelNumber: 14,
    title: "The Campus Navigation Clue",
    caseStudy: "Your team needs to reach a classroom. A campus map shows two routes: one is shorter but has a construction barrier, while the other is slightly longer and clearly open.",
    mission: "Choose based on the information available, not just the shortest distance.",
    questions: [
      {
        id: 40,
        questionNumber: 1,
        question: "What should you do first?",
        options: [
          { text: "Take the shortest route immediately.", outcome: "less_bad" },
          { text: "Check whether the shorter route has a usable detour around the barrier.", outcome: "best" },
          { text: "Always take the longest route because it is safer.", outcome: "worst" },
          { text: "Ignore the barrier because it may be temporary.", outcome: "less_good" },
          { text: "Ask another team to choose for you.", outcome: "neutral" },
        ],
        explanation: "Check whether the shorter route has a usable detour around the barrier (+3,000)."
      },
      {
        id: 41,
        questionNumber: 2,
        question: "The map confirms the barrier blocks the shorter route completely. What is the best choice?",
        options: [
          { text: "Follow another team even if they are going elsewhere.", outcome: "less_good" },
          { text: "Keep walking toward the barrier and decide later.", outcome: "less_bad" },
          { text: "Wait for the barrier to disappear.", outcome: "worst" },
          { text: "Choose randomly between the two routes.", outcome: "neutral" },
          { text: "Use the open route and continue.", outcome: "best" },
        ],
        explanation: "Use the open route and continue (+3,000)."
      },
      {
        id: 42,
        questionNumber: 3,
        question: "Halfway along the open route, you see a clearly marked shortcut that reconnects with the same path. What should you do?",
        options: [
          { text: "Ask another team to test the shortcut first.", outcome: "worst" },
          { text: "Ignore every shortcut because the original plan is safer.", outcome: "neutral" },
          { text: "Use the marked shortcut because it reduces travel without introducing an unknown obstruction.", outcome: "best" },
          { text: "Leave the marked path and cross an unmarked area.", outcome: "less_bad" },
          { text: "Turn back to the starting point.", outcome: "less_good" },
        ],
        explanation: "Use the marked shortcut because it reduces travel without introducing an unknown obstruction (+3,000)."
      }
    ]
  },
  {
    duelNumber: 15,
    title: "The Final 60 Seconds",
    caseStudy: "Your team has one minute left in a campus challenge. You have a mostly correct answer written down, but one teammate wants to replace it with a different answer based on a weak clue.",
    mission: "Make a final decision using the quality of evidence and the time available.",
    questions: [
      {
        id: 43,
        questionNumber: 1,
        question: "What should the team compare before changing the answer?",
        options: [
          { text: "Which answer sounds more impressive.", outcome: "neutral" },
          { text: "Which answer was mentioned last.", outcome: "less_good" },
          { text: "How much independent evidence supports the current answer versus the proposed replacement.", outcome: "best" },
          { text: "Which answer is longer.", outcome: "less_bad" },
          { text: "Which teammate suggested the change.", outcome: "worst" },
        ],
        explanation: "How much independent evidence supports the current answer versus the proposed replacement (+3,000)."
      },
      {
        id: 44,
        questionNumber: 2,
        question: "The current answer is supported by three clear clues; the new answer depends on one uncertain interpretation. What should you do?",
        options: [
          { text: "Discard both answers and start again.", outcome: "worst" },
          { text: "Keep the current answer unless the uncertain clue reveals a definite contradiction.", outcome: "best" },
          { text: "Split the team and submit both answers.", outcome: "less_good" },
          { text: "Wait until time expires to avoid choosing.", outcome: "neutral" },
          { text: "Switch immediately because a new idea might be better.", outcome: "less_bad" },
        ],
        explanation: "Keep the current answer unless the uncertain clue reveals a definite contradiction (+3,000)."
      },
      {
        id: 45,
        questionNumber: 3,
        question: "Five seconds remain and no contradiction has appeared. What is the best action?",
        options: [
          { text: "Restart the discussion.", outcome: "worst" },
          { text: "Submit the evidence-supported answer immediately.", outcome: "best" },
          { text: "Ask the organizer for more time.", outcome: "neutral" },
          { text: "Leave the question unanswered.", outcome: "less_bad" },
          { text: "Change to the last idea mentioned.", outcome: "less_good" },
        ],
        explanation: "Submit the evidence-supported answer immediately (+3,000)."
      }
    ]
  }
];

// Flatten into questions array with duel context
const ALL_QUESTIONS = [];
DUEL_SETS.forEach((duel) => {
  duel.questions.forEach((q) => {
    ALL_QUESTIONS.push({
      id: q.id,
      duelNumber: duel.duelNumber,
      duelTitle: duel.title,
      caseStudy: duel.caseStudy,
      mission: duel.mission,
      questionNumber: q.questionNumber, // 1, 2, or 3
      category: `Duel ${String(duel.duelNumber).padStart(2, '0')}: ${duel.title}`,
      title: `Q${q.questionNumber}/3 · ${duel.title}`,
      question: q.question,
      options: q.options,
      explanation: q.explanation,
    });
  });
});

module.exports = {
  DUEL_SETS,
  ALL_QUESTIONS,
};
