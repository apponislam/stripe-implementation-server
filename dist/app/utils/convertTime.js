"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTimeToMS = void 0;
const convertTimeToMS = (timeString, defaultValue = "90d") => {
    if (!timeString)
        timeString = defaultValue;
    const timeValue = parseInt(timeString);
    if (isNaN(timeValue))
        throw new Error(`Invalid time format: ${timeString}`);
    const unit = timeString.replace(timeValue.toString(), "").toLowerCase();
    switch (unit) {
        case "s":
            return timeValue * 1000; // seconds to ms
        case "m":
            return timeValue * 60 * 1000; // minutes to ms
        case "h":
            return timeValue * 60 * 60 * 1000; // hours to ms
        case "d":
            return timeValue * 24 * 60 * 60 * 1000; // days to ms
        default:
            return timeValue;
    }
};
exports.convertTimeToMS = convertTimeToMS;
