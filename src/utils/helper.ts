export function getDeviceToken(): string {
    let deviceToken = localStorage.getItem("deviceToken");

    if (!deviceToken) {
        deviceToken = crypto.randomUUID();
        localStorage.setItem("deviceToken", deviceToken);
    }

    return deviceToken;
}