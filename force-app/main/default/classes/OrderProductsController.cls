public with sharing class OrderProductsController {
    @AuraEnabled(cacheable=true)
    public static List<PricebookEntry> getProducts(String orderId) {
        return [
            SELECT Id, UnitPrice, Product2Id, Product2.Name, Product2.ProductCode
            FROM PricebookEntry
            WHERE Pricebook2Id IN (
                SELECT Pricebook2Id 
                FROM Order 
                WHERE Id = :orderId
                )
            AND IsActive = TRUE
            WITH SECURITY_ENFORCED
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Map<String,OrderItem> getOrderProducts(String orderId) {
        Map<String,OrderItem> mapPriceEntryItem = new Map<String,OrderItem>();
        for(OrderItem oItem : [
            SELECT Id, Product2Id, Product2.Name, PricebookEntryId, UnitPrice, Quantity, TotalPrice, Product2.ProductCode
            FROM OrderItem
            WHERE OrderId = :orderId
            WITH SECURITY_ENFORCED
        ]){
            mapPriceEntryItem.put(oItem.PricebookEntryId,oItem);
        }
        return mapPriceEntryItem;
    }
}