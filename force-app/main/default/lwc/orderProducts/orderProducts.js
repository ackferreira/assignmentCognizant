import { LightningElement, wire, api } from 'lwc';
import getOrderProducts from '@salesforce/apex/OrderProductsController.getOrderProducts';
import requestCatcherCallOut from '@salesforce/apex/CatcherCallOut.requestCatcherCallOut';
import { subscribe, MessageContext } from 'lightning/messageService';
import SELECTED_PRODUCTS_CHANNEL from '@salesforce/messageChannel/Selected_Products__c';
import { getRecord, createRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const COLUMNS = [{
        label: 'PRODUCT NAME',
        fieldName: 'productName',
        type: 'text'
    },
    {
        label: 'UNIT PRICE',
        fieldName: 'unitPrice',
        type: 'currency'
    },
    {
        label: 'QUANTITY',
        fieldName: 'quantity',
        type: 'integer'
    },
    {
        label: 'TOTAL PRICE',
        fieldName: 'totalPrice',
        type: 'currency'
    }
];

const FIELDS = ['Order.Id', 'Order.Account.AccountNumber', 'Order.Type', 'Order.Status', 'Order.OrderNumber'];

export default class OrderProducts extends LightningElement {
    orderItens = undefined;
    mapOrderItens = undefined;
    error = undefined;
    columns = COLUMNS;
    subscription = null;
    resultApex = undefined;

    @wire(MessageContext)
    messageContext;

    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    order;

    @wire(getOrderProducts, { orderId: '$recordId' })
    wiredOrderItens(result) {
        this.resultApex = result;
        if (result.data) {
            this.orderItens = Object.keys(result.data).map(key => ({
                id: key,
                productName: result.data[key].Product2.Name,
                unitPrice: result.data[key].UnitPrice,
                quantity: result.data[key].Quantity,
                totalPrice: result.data[key].TotalPrice,
                productCode: result.data[key].Product2.ProductCode
            }));
            this.mapOrderItens = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.orderItens = undefined;
        }
    }

    subscribeToMessageChannel() {
        this.subscription = subscribe(
            this.messageContext,
            SELECTED_PRODUCTS_CHANNEL,
            (message) => this.handleMessage(message)
        );
    }

    handleMessage(message) {
            for (var i in message) {
                if (this.mapOrderItens[message[i].pricebookEntryId] === undefined) {
                    const fields = {};
                    fields['Quantity'] = 1;
                    fields['UnitPrice'] = message[i].unitPrice;
                    fields['PricebookEntryId'] = message[i].pricebookEntryId;
                    fields['Product2Id'] = message[i].productId;
                    fields['OrderId'] = this.recordId;
                    const recordInput = { apiName: 'OrderItem', fields };
                    createRecord(recordInput)
                        .then(() => {
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Success',
                                    message: 'Itens submitted',
                                    variant: 'success',
                                }),
                            );
                            return refreshApex(this.resultApex);
                        })
                        .catch(error => {
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Error submitting records',
                                    message: error.body.message,
                                    variant: 'error',
                                }),
                            );
                        });
                } else {
                    const fields = {};
                    fields['Id'] = this.mapOrderItens[message[i].pricebookEntryId].Id;
                    fields['Quantity'] = this.mapOrderItens[message[i].pricebookEntryId].Quantity + 1;
                    const recordInput = { fields };

                    updateRecord(recordInput)
                        .then(() => {
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Success',
                                    message: 'Itens submitted',
                                    variant: 'success',
                                }),
                            );
                            return refreshApex(this.resultApex);
                        })
                        .catch(error => {
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Error submitting records',
                                    message: error.body.message,
                                    variant: 'error',
                                }),
                            );
                        });
                }
            }
        }

    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    handleClick() {
        if (this.order.data.fields.Status.value === 'Activated') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error submitting Order',
                    message: 'Order already activated',
                    variant: 'error',
                }),
            );
        } else {

            const orderProducts = this.orderItens.map(row => {
                return {
                    name: row.productName,
                    code: row.productCode,
                    unitPrice: row.unitPrice,
                    quantity: row.quantity
                }
            });

            const payload = {
                accountNumber: this.order.data.fields.Account.value.fields.AccountNumber.value,
                orderNumber: this.order.data.fields.OrderNumber.value,
                type: this.order.data.fields.Type.value,
                status: this.order.data.fields.Status.value,
                orderProducts: orderProducts
            };

            const stringPayload = JSON.stringify(payload);

            var callOutReturn = false;
            requestCatcherCallOut({ payload: stringPayload })
                .then(result => {
                    callOutReturn = result;
                    if (callOutReturn === true) {
                        const fields = {};
                        fields['Id'] = this.order.data.fields.Id.value;
                        fields['Status'] = 'Activated';
                        const recordInput = { fields };
                        updateRecord(recordInput)
                            .then(() => {
                                this.dispatchEvent(
                                    new ShowToastEvent({
                                        title: 'Success',
                                        message: 'Order submitted',
                                        variant: 'success',
                                    }),
                                );
                                return refreshApex(this.order);
                            })
                            .catch(error => {
                                var message = error.body.message;
                                if (error.body.output.errors[0].message != undefined) {
                                    message = message + ' - ' + error.body.output.errors[0].message;
                                }
                                this.dispatchEvent(
                                    new ShowToastEvent({
                                        title: 'Error submitting Order',
                                        message: message,
                                        variant: 'error',
                                    }),
                                );
                            });
                    }
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error sending order',
                            message: error.body.message,
                            variant: 'error',
                        }),
                    );
                });
        }
    }
}