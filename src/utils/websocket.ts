import { WS_URL } from '../config'
export function connectCustomerWebSocket(
  wsRoute: string,
  onMessage: (data: any) => void,
) {
// console.log("Connecting to route:", wsRoute);
const socket = new WebSocket(
    `${WS_URL}/${wsRoute}`,
);

socket.onopen = () => {
    console.log("WebSocket connected");
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    // console.log("Received:", message);
    onMessage(message);
};

socket.onerror = (error) => {
    // console.error("WebSocket error:", error);
};

socket.onclose = (event) => {
    // , {
    //     code: event.code,
    //     reason: event.reason,
    //     wasClean: event.wasClean,
    // }
    console.log("WebSocket disconnected:");
};

    return socket;
}