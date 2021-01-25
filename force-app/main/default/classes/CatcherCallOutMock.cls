@isTest
global class CatcherCallOutMock implements HttpCalloutMock {
    global HTTPResponse respond(HTTPRequest req) {
        HttpResponse response = new HttpResponse();
        if(req.getBody() == 'error')
            response.setStatusCode(400);
        else
        	response.setStatusCode(200);
        
        return response;
    }
}