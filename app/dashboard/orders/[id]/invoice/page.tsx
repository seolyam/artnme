import { getOrder } from "@/app/actions/orders";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PrintButton } from "@/components/dashboard/print-button";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  const balance =
    parseFloat(order.totalAmount) - parseFloat(order.depositAmount);

  return (
    <div className="min-h-screen bg-white text-black p-8 relative">
      <div className="print:hidden absolute top-4 right-8 flex items-center gap-4">
        <PrintButton />
      </div>

      {/* Invoice Content */}
      <div className="max-w-3xl mx-auto border-t-[16px] border-primary pt-8 px-4">
        <div className="flex justify-between items-start border-b pb-8">
          <div>
            <h1 className="text-4xl font-black text-primary">INVOICE</h1>
            <p className="text-sm mt-1 text-muted-foreground uppercase tracking-widest">
              Art & Me Printing Shop
            </p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-lg">{order.title}</h3>
            <p className="text-sm text-gray-500">Order #{order.id.split("-")[0].toUpperCase()}</p>
            <p className="text-sm text-gray-500">
              Date: {format(new Date(order.createdAt), "MMMM d, yyyy")}
            </p>
            {order.dueDate && (
              <p className="text-sm text-gray-500">
                Due: {format(new Date(order.dueDate), "MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-8 border-b">
          <div>
            <h4 className="font-semibold text-gray-500 uppercase text-xs tracking-wider mb-2">
              Billed To
            </h4>
            <p className="font-bold text-lg">{order.customer.name}</p>
            {order.customer.contactNumber && (
              <p className="text-sm text-gray-600">{order.customer.contactNumber}</p>
            )}
            {order.customer.fbMessengerLink && (
              <p className="text-sm text-gray-600">{order.customer.fbMessengerLink}</p>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-500 uppercase text-xs tracking-wider mb-2">
              Payment Details
            </h4>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-medium text-right">₱{parseFloat(order.totalAmount).toLocaleString()}</span>
              <span className="text-gray-500">Deposit Paid:</span>
              <span className="font-medium text-right">₱{parseFloat(order.depositAmount).toLocaleString()}</span>
              <span className="text-gray-500 font-bold mt-2 pt-2 border-t">Balance Due:</span>
              <span className="font-bold text-right text-lg mt-2 pt-2 border-t">₱{balance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="py-8">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b-2">
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-widest text-xs">Item</th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-widest text-xs">Description</th>
                <th className="pb-3 text-right font-semibold text-gray-500 uppercase tracking-widest text-xs">Qty</th>
                <th className="pb-3 text-right font-semibold text-gray-500 uppercase tracking-widest text-xs">Unit Price</th>
                <th className="pb-3 text-right font-semibold text-gray-500 uppercase tracking-widest text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-4 align-top font-medium">{item.productType}</td>
                  <td className="py-4 align-top text-sm text-gray-600">
                    {item.description || "-"}
                    {item.dimensions && <span className="block mt-1 text-xs text-gray-400">Dimensions: {item.dimensions}</span>}
                  </td>
                  <td className="py-4 align-top text-right">{item.quantity}</td>
                  <td className="py-4 align-top text-right">₱{parseFloat(item.unitPrice).toLocaleString()}</td>
                  <td className="py-4 align-top text-right font-medium">
                    ₱{(item.quantity * parseFloat(item.unitPrice)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-16 text-center text-sm text-gray-500 pb-8">
          <p>Thank you for your business!</p>
          <p className="mt-1 text-xs">For questions, please contact us.</p>
        </div>
      </div>
    </div>
  );
}
