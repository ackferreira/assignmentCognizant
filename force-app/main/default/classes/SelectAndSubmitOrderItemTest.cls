@isTest
public class SelectAndSubmitOrderItemTest {
    
    @testSetup static void setup(){
        Pricebook2 pb = new Pricebook2();
        pb.Id = Test.getStandardPricebookId();
        pb.IsActive = true;
        update pb;
        
        //---CREATING PRODUCTS
        List<Product2> products = new List<Product2>();
        Product2 product01 = new Product2(
        	Name = 'Test Product 01',
            ProductCode = 'TP01'
        );
        products.add(product01);
        
        Product2 product02 = new Product2(
        	Name = 'Test Product 02',
            ProductCode = 'TP02'
        );
        products.add(product02);
        
        Product2 product03 = new Product2(
        	Name = 'Test Product 03',
            ProductCode = 'TP03'
        );
        products.add(product03);
        
        insert(products);
        
        //---CREATING PRICEBOOKENTRY
        List<PricebookEntry> pbEntries = new List<PricebookEntry>();
        PricebookEntry pbEntry01 = new PricebookEntry(
        	Product2Id = product01.Id,
            Pricebook2Id = pb.Id,
            UnitPrice = 10
        );
        pbEntries.add(pbEntry01);
        
        PricebookEntry pbEntry02 = new PricebookEntry(
        	Product2Id = product02.Id,
            Pricebook2Id = pb.Id,
            UnitPrice = 10
        );
        pbEntries.add(pbEntry02);
        
        PricebookEntry pbEntry03 = new PricebookEntry(
        	Product2Id = product03.Id,
            Pricebook2Id = pb.Id,
            UnitPrice = 10
        );
        pbEntries.add(pbEntry03);
        
        insert(pbEntries);
        
        Account account01 = new Account(
            Name='Test01'
        );
        insert account01;
        
        Contract contract01 = new Contract(
            AccountId = account01.Id,
            StartDate = System.today(),
            Status = 'Draft'
        );
        insert contract01;
        
        contract01.Status = 'Activated';
        update contract01;
        
        Order order01 = new Order(
        	AccountId = account01.Id,
            ContractId = contract01.Id,
            EffectiveDate = System.today(),
            Status = 'Draft'
        );
        
        insert order01;
    }
    
    private static testMethod void getProductsTest(){
        Order orderTest = [SELECT Id FROM Order LIMIT 1];
        
        Test.startTest();
        OrderProductsController.getProducts(orderTest.Id);
        OrderProductsController.getOrderProducts(orderTest.Id);
        Test.stopTest();
    }
    
    private static testMethod void submitProductsTest(){
        Order orderTest = [SELECT Id FROM Order LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new CatcherCallOutMock());
        
        Test.startTest();
        
        boolean mockReturn = CatcherCallOut.requestCatcherCallOut('success');
        system.assert(true, mockReturn);
        try{
            mockReturn = CatcherCallOut.requestCatcherCallOut('error');
        }
        catch(Exception ex){
            system.assertEquals('Call out failed', ex.getMessage());
        }
        
        Test.stopTest();
    }
}