public class CatcherCallOut {
    @AuraEnabled
    public static boolean requestCatcherCallOut(String payload) {
        boolean resCallOut = false;
        
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://submitorderkaspa.requestcatcher.com/');
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setTimeout(30000);
        request.setBody(payload);
        HttpResponse response = http.send(request);
        
        if(response.getStatusCode() == 200){
            resCallOut = true;
        }
        else{
            throw new CalloutException('Call out failed');
        }
        
        return resCallOut;
    }
}