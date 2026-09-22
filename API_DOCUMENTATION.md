# AI Call Assistant API

Base URL: `http://localhost:5000`. JSON responses use `success`; errors are `{ "success": false, "message": "..." }`. Management endpoints require `Authorization: Bearer <token>`.

## Authentication

| Method | URL | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a user or shop owner. Body: `{name,email,password,role?}`; password is 8+ chars. Returns `201`, token and user. |
| POST | `/api/auth/login` | No | Login. Body: `{email,password}`. Returns token and user, or `401`. |

## Customers

| Method | URL | Auth | Request / result |
|---|---|---|---|
| POST | `/api/customers` | No | `{name,phone,address?,email?}`; creates customer (`201`). |
| POST | `/api/customers/register` | No | `{name,phone,address,email?}`; call registration (`201`). |
| GET | `/api/customers` | No | Lists customers (`200`). |
| GET | `/api/customers/phone/:phone` | No | Finds a customer (`200`/`404`). |
| GET | `/api/customers/recognize/:phone` | No | Returns whether caller exists (`200`). |

## Orders

| Method | URL | Auth | Request / result |
|---|---|---|---|
| POST | `/api/orders` | No | `{phone,items,amount}`; creates an order (`201`). |
| GET | `/api/orders` | No | Lists orders. |
| GET | `/api/orders/customer/:phone` | No | Lists a customer's orders. |
| GET | `/api/orders/customer/:phone/details` | No | Customer plus history. |
| POST | `/api/orders/new-customer` | No | `{name,phone,address?,email?,items,amount}`; customer and first order. |
| PUT | `/api/orders/:id/status` | No | `{status}` where status is pending/confirmed/completed/cancelled. |

## Calls and conversations

`POST /api/call` and `POST /api/calls/incoming` are public webhook/Postman simulation endpoints. Send `{phone}` to create a call and conversation; optionally send `{name,address,email,items,amount}` to also create the customer/order. Each response includes a unique `callId` and `conversationId`.

| Method | URL | Auth | Purpose |
|---|---|---|---|
| GET | `/api/calls` | shop_owner/admin | List calls. |
| GET | `/api/calls/:callId` | shop_owner/admin | Get one call. |
| PUT | `/api/calls/:callId/status` | shop_owner/admin | `{status}`: incoming, active, completed, failed, cancelled. |
| PUT | `/api/calls/:callId/end` | shop_owner/admin | Marks call/conversation completed. |
| GET | `/api/calls/:callId/conversation` | shop_owner/admin | Gets that call's conversation only. |
| POST | `/api/conversations` | shop_owner/admin | `{callId,messages?}` creates an additional conversation only if one does not already exist. |
| POST | `/api/conversations/:conversationId/messages` | shop_owner/admin | `{sender,message}`; sender is customer/ai/shop_owner/system. |
| GET | `/api/conversations/:conversationId` | shop_owner/admin | Gets history. |

All malformed values return `400`; missing resources `404`; duplicates `409`; missing/invalid credentials `401`; insufficient role `403`; unexpected errors `500` without sensitive details in production.
