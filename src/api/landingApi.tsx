import { API_URL } from '../config'
export async function getLandingData(tabQr: string, deviceToken: string, seshToken: string | null) {

    return fetch(`${API_URL}/customer/tables/${encodeURIComponent(tabQr)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-DEVICE-TOKEN': deviceToken,
            "X-DINING-SESSION-TOKEN" : seshToken ?? ""
        },
    })
}


export async function requestToJoin(
    tabQr: string,
    deviceToken: string,
    seshToken: string | null
) {
    return fetch(
        `${API_URL}/customer/tables/${encodeURIComponent(tabQr)}/join-request`,
        {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-DEVICE-TOKEN': deviceToken,
                "X-DINING-SESSION-TOKEN" : seshToken ?? ""
            },
        }
    );
}


export async function getJoinRequestStatus(
    tabQr: string,
    requestToken: string,
    deviceToken: string,
    seshToken: string | null
) {
    return fetch(
        `${API_URL}/customer/tables/${encodeURIComponent(tabQr)}/join-request/status/${encodeURIComponent(requestToken)}`,
        {
            method: 'GET',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'X-DEVICE-TOKEN': deviceToken,
                "X-DINING-SESSION-TOKEN" : seshToken ?? ""
            },
        }
    );
}


export async function approveJoinRequest(
    tabQr: string,
    requestToken: string,
    deviceToken: string,
    approved: boolean,
    seshToken : string | null
) {
    return fetch(
        `${API_URL}/customer/tables/${encodeURIComponent(tabQr)}/join-request/approval`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-DEVICE-TOKEN": deviceToken,
                "X-DINING-SESSION-TOKEN" : seshToken ?? ""
            },
            body: JSON.stringify({
                request_token: requestToken,
                approved,
            }),
        }
    );
}


export async function itemApi(
    itemId : number,
    tabQr: string
) {
    return fetch(`${API_URL}/customer/tables/${encodeURIComponent(tabQr)}/item/${itemId}/${localStorage.getItem('diningSessionToken')}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    })
}
