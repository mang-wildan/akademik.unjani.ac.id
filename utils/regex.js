// Escapes user input for use inside new RegExp()/$regex, so characters such as ( or * are searched literally.
exports.escapeRegex = text => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
