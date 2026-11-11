import { API_URL } from '../config'
import type {StoredCartItem} from "../types/globals"

export async function addItemToCartApi(
    cartItems: StoredCartItem[],
    tableQr: string | undefined
) {
    if (!tableQr) {
        throw new Error("A table QR code is required to update the cart.");
    }

    return fetch(`${API_URL}/customer/tables/${encodeURIComponent(tableQr)}/cart/${localStorage.getItem('diningSessionToken')}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItems),
    })
}

export async function getCartItemsApi(
    tableQr:string
){
    return fetch(`${API_URL}/customer/tables/${tableQr}/shared-cart/${localStorage.getItem('diningSessionToken')}`,{
        method:'GET',
        credentials: 'include',
        headers : {
            "Accept" : 'application/json',
            "Content-Type" : 'application/json'
        }
    })
}

export async function placeOrderApi(
    cartItems: StoredCartItem[],
    tableQr:string
){
    return fetch(`${API_URL}/customer/tables/${encodeURIComponent(tableQr)}/orders/${localStorage.getItem('diningSessionToken')}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItems),
    })
}

export async function cancelCustomerOrder(
    tableQr:string,
    orderId:number
){
    return fetch(
        `${API_URL}/customer/tables/${encodeURIComponent(tableQr)}/orders/${localStorage.getItem('diningSessionToken')}/cancel/${orderId}`, 
        {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }
    )
}

