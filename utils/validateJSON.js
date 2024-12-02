function validateJSON(json) {
    // Define expected structure
    const schema = {
        accept: "boolean",
        reason: "string",
    };

    // Validate JSON keys and types
    for (const key in schema) {
        if (!json.hasOwnProperty(key) || typeof json[key] !== schema[key]) {
            return false;
        }
    }

    return true;
}

export default validateJSON;
