// COMMON CODE FOR BOTH WEBSITE FRONT END AND FIREBASE BACK END //

/** Custom method definition for replacing all instances of a substring within a string instance. */
String.prototype.replaceAll = function replaceAll(search, replacement) {
  return this.split(search).join(replacement);
};

/** Return an array consisting of the date's year, month (one-padded) and day of the month.
 * If no date is provided, defaults to using the current date.
 */
function dateToArray(date) {
  // don't use default function argument for 'date' as that is evaluated at compile time, not runtime.
  // at least that's how it works in other languages, I haven't tested it in JavaScript ;)
  date === undefined && (date = new Date());
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

/** Return the array's elements as a string separated by the '-' character. */
function serialiseDateArray(
  dateArray = [],
  nextMidnight = false,
  forceTimezone
) {
  // This formats the date as yyyy-m-d
  const serialised = dateArray.join("-");
  // Convert the date so it is always at exactly midnight
  const date = dateArray.length < 3 ? new Date() : new Date(serialised);
  const userTimezone = forceTimezone ?? -date.getTimezoneOffset();
  date.setUTCMinutes(userTimezone);
  if (nextMidnight) {
    date.setUTCHours(24, 0, 0, -1);
  } else {
    date.setUTCHours(0, 0, 0, 0);
  }
  // This formats the date as yyyy-mm-dd
  // splitting the string at 'T' and returning the first element of the split only gets you "yyyy-MM-dd"
  return date.toISOString().split("T").shift();
}

function formatTime(hoursAndMinutes) {
  const date = new Date();
  date.setHours(...hoursAndMinutes);
  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

module.exports = { dateToArray, serialiseDateArray, formatTime };
