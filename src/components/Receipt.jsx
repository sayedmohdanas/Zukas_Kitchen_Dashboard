import React from 'react';
import './Receipt.css';

const Receipt = ({ order }) => {
  if (!order) return null;

  // Format dates/times based on what is available in order
  let orderDate = "N/A";
  let billTime = "N/A";
  
  if (order.createdAt && order.createdAt.toDate) {
    const d = order.createdAt.toDate();
    orderDate = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    billTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // Calculate totals
  const subtotal = order.items ? order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0) : order.total;
  const deliveryCharge = 0; // Or from order if available

  return (
    <div className="receipt-wrapper">
      <div id="receipt-capture-area" className="receipt-container">
      <div className="receipt-content">
        
        {/* Header Region */}
        <div className="receipt-header-row">
          <div className="receipt-logo-wrapper">
            <img src="/favicon.jpg" alt="Zukas Kitchen" className="receipt-logo" />
          </div>
          <div className="receipt-title-wrapper">
            <h1 className="receipt-title">ZUKAS KITCHEN</h1>
            <p className="receipt-subtitle">From Our Kitchen to You ♥</p>
            <div className="receipt-serving">
              <span style={{display: 'block', fontSize: '13px', marginBottom: '2px'}}>Serving:</span>
              <strong>Khankah, Bindwal, Jairajpur, Jagmalpur</strong>
            </div>
          </div>
        </div>

        <div className="receipt-divider-thick"></div>

        {/* Info Region */}
        <div className="receipt-info-grid">
          <div>
            <div className="info-row"><strong>Order No:</strong> {order.id?.toUpperCase() || 'ZK-1000'}</div>
            <div className="info-row"><strong>Date:</strong> {orderDate}</div>
            <div className="info-row"><strong>Bill Time:</strong> {billTime}</div>
            <div className="info-row"><strong>Delivery Time:</strong> {order.customDeliveryTime || 'ASAP'}</div>
          </div>
          <div>
            <div className="info-row"><strong>Customer:</strong> {order.customerName}</div>
            <div className="info-row"><strong>Phone:</strong> {order.phone}</div>
            <div className="info-row" style={{ alignItems: 'flex-start' }}>
              <strong>Address:</strong> 
              <span style={{ marginLeft: '6px', lineHeight: '1.2' }}>{order.village}{order.address && <><br/>{order.address}</>}</span>
            </div>
          </div>
        </div>

        {/* Table Region */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th style={{ width: '15%', textAlign: 'center' }}>QTY</th>
              <th style={{ width: '45%' }}>ITEM</th>
              <th style={{ width: '20%', textAlign: 'center' }}>PRICE</th>
              <th style={{ width: '20%', textAlign: 'right' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items && order.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.qty || 1}</td>
                <td>
                  <div style={{ fontWeight: '600' }}>{item.name}</div>
                  {item.variant && <div className="item-variant">{item.variant}</div>}
                </td>
                <td style={{ textAlign: 'center' }}>₹{item.price || 0}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{(item.price || 0) * (item.qty || 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Region */}
        <div className="receipt-totals-container">
          <div className="receipt-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="total-row">
              <span>Delivery Charge</span>
              <span>₹{deliveryCharge}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total Payable</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="receipt-payment-info">
          <div className="info-row">
            <span style={{width: '120px'}}>Payment Method:</span>
            <span className="badge dark-green">{order.paymentMethod || 'Cash'}</span>
          </div>
          <div className="info-row">
            <span style={{width: '120px'}}>Payment Status:</span>
            <span className="badge dark-green">{order.paymentStatus || 'PAID'}</span>
          </div>
        </div>

        <div className="receipt-divider-thin"></div>

        {/* Footer */}
        <div className="receipt-footer">
          <div className="enjoy-badge">Enjoy your food, don't forget to review!</div>
          
          <p className="referral-text">
            <strong>If you refer your friends, your next order gets 10% OFF.</strong><br/>
            (Ask your friend to send your name while ordering)
          </p>
          
          <div className="cursive-footer">
             Good Food • Happy Customers • Bigger Family ♥
          </div>
        </div>

      </div>
      </div>
    </div>
  );
};

export default Receipt;
