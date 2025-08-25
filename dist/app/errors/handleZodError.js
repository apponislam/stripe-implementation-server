"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleZodError = (err) => {
    const errorSources = err.issues.map((issue) => {
        const lastPath = issue.path[issue.path.length - 1];
        return {
            path: typeof lastPath === "symbol" ? lastPath.toString() : lastPath,
            message: issue.message,
        };
    });
    const statusCode = 400;
    return {
        statusCode,
        message: "Validation Error",
        errorSources,
    };
};
exports.default = handleZodError;
