import { notFound } from "next/navigation";
import { getOrder } from "@/app/actions/orders";

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  const balance = parseFloat(order.totalAmount) - parseFloat(order.depositAmount);

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white text-black min-h-screen">
      {/* Auto-print script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.onload = function() { window.print(); }`,
        }}
      />

      <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Art 'n Me</h1>
          <p className="text-sm text-gray-500">Digital Printing Services</p>
          <p className="text-sm text-gray-500">Receipt / Invoice</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-700">Order ID: <span className="font-normal">{order.id.slice(0,8)}</span></p>
          <p className="text-sm text-gray-700">Date: <span className="font-normal">{new Date(order.createdAt).toLocaleDateString()}</span></p>
          {order.dueDate && (
             <p className="text-sm text-gray-700">Due: <span className="font-normal">{new Date(order.dueDate).toLocaleDateString()}</span></p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Customer Details</h2>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="font-medium text-gray-900">{order.customer.name}</p>
          {order.customer.contactNumber && <p className="text-sm text-gray-600">Contact: {order.customer.contactNumber}</p>}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Order Summary: {order.title}</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-600">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 font-medium">Dimensions</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-800">
            {order.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 last:border-0">
                <td className="py-3">
                  <span className="font-medium">{item.productType}</span>
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                </td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3">{item.dimensions || "-"}</td>
                <td className="py-3 text-right">{"\u20B1"}{parseFloat(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="py-3 text-right">{"\u20B1"}{(item.quantity * parseFloat(item.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-1/2 space-y-2 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{"\u20B1"}{parseFloat(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-600">Deposit Paid</span>
            <span className="font-medium">{"\u20B1"}{parseFloat(order.depositAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="font-bold text-gray-800 text-base">Balance Due</span>
            <span className="font-bold text-gray-800 text-base">{"\u20B1"}{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-xs text-gray-500">
        <p>Thank you for your business!</p>
        <p className="mt-1 print:hidden">
          (Press Ctrl+P / Cmd+P to print this receipt. Close this tab to return.)
        </p>
      </div>
    </div>
  );
}
