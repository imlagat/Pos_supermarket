const fs = require('fs');
const file = '/Users/mac/Desktop/supermarket/frontend/src/pages/PurchaseOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `  const [showModal, setShowModal] = useState(false);`,
  `  const [showModal, setShowModal] = useState(false);\n  const [editingPoId, setEditingPoId] = useState(null);\n  const [expandedOrder, setExpandedOrder] = useState(null);`
);

content = content.replace(
  `  const handleSubmit = async (e) => {`,
  `  const handleEdit = (order) => {
    setEditingPoId(order.id);
    setForm({
      supplier_id: order.supplier_id,
      order_date: order.order_date.slice(0, 10),
      expected_delivery_date: order.expected_delivery_date ? order.expected_delivery_date.slice(0, 10) : '',
      notes: order.notes || '',
      items: order.items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        cost_price: i.cost_price,
        expiry_date: i.expiry_date || ''
      }))
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {`
);

content = content.replace(
  `      await api.post('/purchase-orders', {`,
  `      if (editingPoId) {
        await api.put(\`/purchase-orders/\${editingPoId}\`, {
          supplier_id: form.supplier_id,
          order_date: form.order_date,
          expected_delivery_date: form.expected_delivery_date || null,
          notes: form.notes,
          items: form.items.filter(i => i.product_id && i.quantity && i.cost_price)
        });
        toast.success('Purchase order updated');
      } else {
        await api.post('/purchase-orders', {`
);

content = content.replace(
  `      toast.success('Purchase order created');\n      setShowModal(false);`,
  `      toast.success('Purchase order created');\n      }\n      setShowModal(false);\n      setEditingPoId(null);`
);

content = content.replace(
  `  const resetForm = () => {`,
  `  const resetForm = () => {\n    setEditingPoId(null);`
);

content = content.replace(
  `            {filteredOrders.map(order => (\n              <tr key={order.id} className="border-b hover:bg-gray-50">`,
  `            {filteredOrders.map(order => (\n              <React.Fragment key={order.id}>\n              <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>`
);

content = content.replace(
  `              </tr>\n            ))}`,
  `              </tr>
              {expandedOrder === order.id && (
                <tr className="bg-gray-50">
                  <td colSpan="7" className="p-4 border-b">
                    <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100">
                      <h4 className="font-semibold text-gray-700 mb-3">Order Items</h4>
                      <table className="w-full text-sm">
                        <thead className="text-gray-500 border-b">
                          <tr>
                            <th className="text-left pb-2">Product</th>
                            <th className="text-left pb-2">Quantity</th>
                            <th className="text-left pb-2">Unit Cost</th>
                            <th className="text-left pb-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map(item => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="py-2">{item.product?.name || 'Unknown Product'}</td>
                              <td className="py-2">{item.quantity}</td>
                              <td className="py-2">Ksh {item.cost_price}</td>
                              <td className="py-2 font-medium">Ksh {(item.quantity * item.cost_price).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}`
);

content = content.replace(
  `import { useEffect, useState } from 'react';`,
  `import React, { useEffect, useState } from 'react';`
);

content = content.replace(
  `                  {order.status === 'draft' && (\n                    <button onClick={() => handleApprove(order.id)} className="text-blue-600 hover:text-blue-800 font-medium text-sm" title="Approve Order">\n                      Approve\n                    </button>\n                  )}`,
  `                  {order.status === 'draft' && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(order); }} className="text-amber-600 hover:text-amber-800 font-medium text-sm" title="Edit Order">
                        Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(order.id); }} className="text-blue-600 hover:text-blue-800 font-medium text-sm" title="Accept & Send">
                        Accept & Send
                      </button>
                    </>
                  )}`
);

content = content.replace(
  `                  {order.status === 'pending' && (\n                    <button onClick={() => handleReceive(order.id)} className="text-green-600 hover:text-green-800" title="Receive Order">`,
  `                  {order.status === 'pending' && (\n                    <button onClick={(e) => { e.stopPropagation(); handleReceive(order.id); }} className="text-green-600 hover:text-green-800" title="Receive Order">`
);

content = content.replace(
  `<h2 className="text-xl font-bold">Create Purchase Order</h2>`,
  `<h2 className="text-xl font-bold">{editingPoId ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>`
);

content = content.replace(
  `<button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-xl font-semibold">{saving ? 'Saving...' : 'Create PO'}</button>`,
  `<button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-xl font-semibold">{saving ? 'Saving...' : (editingPoId ? 'Update PO' : 'Create PO')}</button>`
);

content = content.replace(
  `<button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">`,
  `<button onClick={() => { resetForm(); setShowModal(true); }} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">`
);


fs.writeFileSync(file, content);
console.log('Success');
