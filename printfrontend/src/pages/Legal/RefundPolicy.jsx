import React from 'react';
import DynamicLegalPage from './DynamicLegalPage';
import './Legal.css';

const RefundPolicy = () => {
    return (
        <DynamicLegalPage pageType="refund" title="Refund, Cancellation & Return Policy" icon={null}>
            <div className="legal-page">
                <div className="legal-plain">
                    <h1>Refund and Cancellation Policy</h1>
                    <p className="legal-updated">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <p>
                        This refund and cancellation policy outlines how you can cancel or seek a refund for a product / service that you have purchased through the Platform. Under this policy:
                    </p>

                    <h2>Cancellation Policy</h2>
                    <p>
                        Cancellations will only be considered if the request is made within 2 days of placing the order. However, cancellation requests may not be entertained if the orders have been communicated to such sellers / merchant(s) listed on the Platform and they have initiated the process of shipping them, or the product is out for delivery. In such an event, you may choose to reject the product at the doorstep.
                    </p>
                    <p>
                        PrintDoot does not accept cancellation requests for perishable items like flowers, eatables, etc. However, the refund / replacement can be made if the user establishes that the quality of the product delivered is not good.
                    </p>

                    <h2>Damaged or Defective Items</h2>
                    <p>
                        In case of receipt of damaged or defective items, please report to our customer service team. The request would be entertained once the seller/ merchant listed on the Platform, has checked and determined the same at its own end. This should be reported within 2 days of receipt of products. In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 2 days of receiving the product. The customer service team after looking into your complaint will take an appropriate decision.
                    </p>
                    <p>
                        In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them.
                    </p>

                    <h2>Refund Processing</h2>
                    <p>
                        In case of any refunds approved by PrintDoot, it will take 1 day for the refund to be processed to you.
                    </p>

                    <h2>Return Policy</h2>
                    <p>
                        We offer refund / exchange within first 1 day from the date of your purchase. If 1 day has passed since your purchase, you will not be offered a return, exchange or refund of any kind. In order to become eligible for a return or an exchange:
                    </p>
                    <ul>
                        <li>The purchased item should be unused and in the same condition as you received it.</li>
                        <li>The item must have original packaging.</li>
                        <li>If the item that you purchased on a sale, then the item may not be eligible for a return/exchange.</li>
                    </ul>
                    <p>
                        Further, only such items are replaced by us (based on an exchange request), if such items are found defective or damaged.
                    </p>
                    <p>
                        You agree that there may be a certain category of products/items that are exempted from returns or refunds. Such categories of the products would be identified to you at the time of purchase.
                    </p>
                    <p>
                        For exchange / return accepted request(s) (as applicable), once your returned product / item is received and inspected by us, we will send you an email to notify you about receipt of the returned / exchanged product. Further, if the same has been approved after the quality check at our end, your request (i.e. return/exchange) will be processed in accordance with our policies.
                    </p>

                    <h2>Shipping Policy</h2>
                    <p>
                        The orders for the user are shipped through registered domestic courier companies and/or speed post only. Orders are shipped within 2 days from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation and delivering of the shipment, subject to courier company / post office norms. Platform Owner shall not be liable for any delay in delivery by the courier company / postal authority. Delivery of all orders will be made to the address provided by the buyer at the time of purchase. Delivery of our services will be confirmed on your email ID as specified at the time of registration. If there are any shipping cost(s) levied by the seller or the Platform Owner (as the case be), the same is not refundable.
                    </p>

                    <p>
                        If you have any questions about our refund and return policy, please contact us at <a href="mailto:support@printdoot.com">support@printdoot.com</a> or call <a href="tel:+919717222125">+91 97172-22125</a> (Monday – Friday, 9:00 AM – 6:00 PM IST).
                    </p>
                </div>
            </div>
        </DynamicLegalPage>
    );
};

export default RefundPolicy;
