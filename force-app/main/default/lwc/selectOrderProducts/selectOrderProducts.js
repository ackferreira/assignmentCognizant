import { LightningElement, wire, api } from 'lwc';
import getProducts from '@salesforce/apex/OrderProductsController.getProducts';
import { publish, MessageContext } from 'lightning/messageService';
import SELECTED_PRODUCTS_CHANNEL from '@salesforce/messageChannel/Selected_Products__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';

const COLUMNS = [{
        label: 'PRODUCT NAME',
        fieldName: 'productName',
        type: 'text'
    },
    {
        label: 'PRODUCT PRICE',
        fieldName: 'listPrice',
        type: 'currency'
    }
];

const FIELDS = ['Order.Id', 'Order.Status'];

export default class SelectOrderProducts extends LightningElement {
    products = undefined;
    error = undefined;
    columns = COLUMNS;
    resultApex = null;

    @wire(MessageContext)
    messageContext;

    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    order;

    @wire(getProducts, { orderId: '$recordId' })
    wiredProducts(result) {
        this.resultApex = result;
        if (result.data) {
            this.products = result.data.map(row => {
                return {
                    id: row.Id,
                    listPrice: row.UnitPrice,
                    productName: row.Product2.Name,
                    productId: row.Product2Id
                }
            })
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.products = undefined;
        }
    }

    handleClick() {
        if (this.order.data.fields.Status.value === 'Activated') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error submitting Order',
                    message: 'Order already activated. It is not possible to add more products.',
                    variant: 'error',
                }),
            );
        } else {
            var el = this.template.querySelector('lightning-datatable');
            var selected = el.getSelectedRows();

            const payload = selected.map(row => {
                return {
                    pricebookEntryId: row.id,
                    unitPrice: row.listPrice,
                    quantity: 1,
                    productId: row.productId
                }
            })

            publish(this.messageContext, SELECTED_PRODUCTS_CHANNEL, payload);
        }
        this.template.querySelector('form').reset();
    }
}