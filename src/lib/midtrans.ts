type SnapResponse = { token: string; redirect_url: string };
const apiBase = () => process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';

function authorization() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error('Midtrans belum dikonfigurasi.');
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

export async function createSnapPayment(input: { orderId: string; amount: number; name: string; email: string; finishUrl: string }): Promise<SnapResponse> {
  const response = await fetch(`${apiBase()}/snap/v1/transactions`, {
    method: 'POST',
    headers: { Authorization: authorization(), Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      customer_details: { first_name: input.name.slice(0, 50), email: input.email },
      expiry: { unit: 'minutes', duration: 30 },
      page_expiry: { unit: 'minutes', duration: 30 },
      callbacks: { finish: input.finishUrl },
    }),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.token || !data?.redirect_url) throw new Error('Midtrans tidak dapat membuat sesi pembayaran.');
  return data as SnapResponse;
}

export async function getMidtransStatus(orderId: string) {
  const response = await fetch(`${apiBase()}/v2/${encodeURIComponent(orderId)}/status`, { headers: { Authorization: authorization(), Accept: 'application/json' }, cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error('Status pembayaran belum dapat diverifikasi.');
  return data as { transaction_status: string; payment_type?: string; gross_amount: string; order_id: string; transaction_id?: string; fraud_status?: string };
}

export async function cancelMidtransSession(token: string) {
  const response = await fetch(`${apiBase()}/snap/v1/transactions/${encodeURIComponent(token)}/cancel`, { method: 'POST', headers: { Authorization: authorization(), Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error('Sesi pembayaran tidak dapat dibatalkan.');
}

export async function cancelMidtransOrder(orderId: string) {
  const response = await fetch(`${apiBase()}/v2/${encodeURIComponent(orderId)}/cancel`, { method: 'POST', headers: { Authorization: authorization(), Accept: 'application/json' }, cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error('Transaksi pembayaran belum dapat dibatalkan.');
  return data;
}

export async function requestMidtransRefund(orderId: string, amount: number, refundKey: string) {
  const response = await fetch(`${apiBase()}/v2/${encodeURIComponent(orderId)}/refund`, {
    method: 'POST', headers: { Authorization: authorization(), Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refund_key: refundKey, amount, reason: 'Pembatalan booking sebelum batas check-in' }), cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error('Midtrans belum menerima permintaan refund untuk metode pembayaran ini. Hubungi hotel untuk proses refund.');
  return data as { transaction_status: string; refund_key: string };
}
