import { API_URL } from '../config'

export async function getLandingData(tabQr: string) {

    return fetch(`${API_URL}/customer/tables/${encodeURIComponent(tabQr)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    })
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