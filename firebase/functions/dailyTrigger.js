const { dateToArray, serialiseDateArray } = require("./common");
const { sendEventNotification } = require("./sendgrid");
const { db, generateLuckyNumbers } = require("./util");

/** Returns `false` if the lucky numbers need to be updated, otherwise returns `true`. */
function numbersAreCurrent(data) {
  // return false if the update is forced or if there is no lucky numbers data
  if (!data) {
    console.warn(
      "There is no existing lucky numbers data. Generating new data."
    );
    return false;
  }
  // return true if the lucky numbers data is for today
  const todayString = serialiseDateArray(dateToArray());
  if (data.date === todayString) {
    console.info(
      "The existing lucky numbers data is for today. Skipping regeneration."
    );
    return true;
  }
  // return true if it's weekend or a free day
  const freeDays = data.freeDays ?? [];
  const weekday = new Date().getDay();
  console.info("The existing lucky numbers data is not for today.");
  return [0, 6].includes(weekday) || freeDays.includes(todayString);
}

/** Updates the lucky numbers in the database. */
async function updateLuckyNumbers() {
  const luckyNumbersDoc = db.collection("_general").doc("luckyNumbers");
  const doc = await luckyNumbersDoc.get();
  const data = doc.data();

  // Check if it's a holiday, weekend etc.
  if (numbersAreCurrent(data)) return;

  // Regenerate lucky numbers data
  const newData = generateLuckyNumbers(data);
  // Update the data in the database
  await luckyNumbersDoc.set(newData);
}

/** Gets all events for today and notifies the subscribed users. */
async function notifyAboutEvents() {
  const querySnapshot = await db
    .collection("events")
    .where("date", "==", dateToArray())
    .get();

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (!data) return;
    console.debug("Processing notifications for event", doc.id, data.title);
    // Don't send the email if there are no recipients
    if (Object.keys(data.notificationsFor ?? {}).length === 0) return;
    sendEventNotification(data.notificationsFor, data, doc.id);
  });
}

async function dailyTrigger(_context) {
  await updateLuckyNumbers();
  await notifyAboutEvents();
}

module.exports = dailyTrigger;
