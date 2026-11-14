export function getDeviceToken(): string {
    let deviceToken = localStorage.getItem("deviceToken");

    if (!deviceToken) {
        deviceToken = crypto.randomUUID();
        localStorage.setItem("deviceToken", deviceToken);
    }

    return deviceToken;
}
export function removePrefixTable(
    tableName: string | undefined
): string | undefined {
    if (tableName) {
        return tableName.replace(/^table/i, "").trim();
    }

    return tableName;
}