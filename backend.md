# 📋 Step-by-Step Postman Testing Guide

## 1. HEALTH CHECK

**Endpoint:**\
`GET http://localhost:5000/api/health`

-   Method: GET\
-   Headers: None required\
-   Body: None\
-   **Expected Response:** Status 200 with server info

------------------------------------------------------------------------

## 2. USER REGISTRATION

### Register a Student

**Endpoint:**\
`POST http://localhost:5000/api/auth/register`

-   Headers: `Content-Type: application/json`\
-   Body (JSON):\

``` json
{
  "name": "John Smith",
  "email": "john.student@example.com",
  "password": "password123",
  "role": "student",
  "class": "10A"
}
```

### Register a Faculty Member

**Endpoint:**\
`POST http://localhost:5000/api/auth/register`

-   Headers: `Content-Type: application/json`\
-   Body (JSON):\

``` json
{
  "name": "Dr. Sarah Wilson",
  "email": "sarah.faculty@example.com",
  "password": "password123",
  "role": "faculty",
  "department": "Computer Science"
}
```

-   **Expected Response:** User data + JWT token

------------------------------------------------------------------------

## 3. USER LOGIN

**Endpoint:**\
`POST http://localhost:5000/api/auth/login`

-   Headers: `Content-Type: application/json`\
-   Body (JSON):\

``` json
{
  "email": "john.student@example.com",
  "password": "password123"
}
```

-   **Expected Response:** User data + JWT token

⚠️ **Important:** Copy the token from response - you'll need it for all
protected routes!

------------------------------------------------------------------------

## 4. PROTECTED ROUTES SETUP

For all routes below, add this header:

    Authorization: Bearer YOUR_JWT_TOKEN_HERE

------------------------------------------------------------------------

## 5. USER PROFILE MANAGEMENT

### Get Current User Profile

`GET http://localhost:5000/api/auth/profile`

### Update User Profile

`PUT http://localhost:5000/api/auth/profile`

Headers:\
- Authorization: Bearer YOUR_JWT_TOKEN_HERE\
- Content-Type: application/json

Body (JSON):

``` json
{
  "name": "John Smith Updated",
  "class": "11A"
}
```

------------------------------------------------------------------------

## 6. LEAVE BALANCE

**Endpoint:**\
`GET http://localhost:5000/api/leave/balance`

-   Headers: Authorization: Bearer YOUR_JWT_TOKEN_HERE\
-   **Expected Response:** Leave balance (Casual: 12, Sick: 8, Earned:
    15)

------------------------------------------------------------------------

## 7. CREATE LEAVE REQUEST

**Endpoint:**\
`POST http://localhost:5000/api/leave`

-   Headers:
    -   Authorization: Bearer YOUR_JWT_TOKEN_HERE\
    -   Content-Type: application/json
-   Body (JSON):\

``` json
{
  "leaveType": "Medical",
  "fromDate": "2024-12-15",
  "toDate": "2024-12-17",
  "reason": "Medical emergency - doctor appointment and recovery",
  "priorityLevel": "High"
}
```

-   **Expected Response:** Leave request created successfully\
    ⚠️ Copy the `_id` from response for next steps!

------------------------------------------------------------------------

## 8. VIEW LEAVE REQUESTS

### Get Your Own Leave Requests (Student/Faculty)

`GET http://localhost:5000/api/leave/my-requests`

Query Parameters (optional):\
- status=Pending (or Approved, Rejected, All)\
- page=1\
- limit=10

### Get All Leave Requests (Faculty Only)

`GET http://localhost:5000/api/leave/all-requests`

Query Parameters (optional):\
- status=Pending\
- search=John (search by name/email/class)\
- page=1\
- limit=10

------------------------------------------------------------------------

## 9. VIEW LEAVE REQUEST DETAILS

**Endpoint:**\
`GET http://localhost:5000/api/leave/LEAVE_REQUEST_ID`

Replace `LEAVE_REQUEST_ID` with actual ID from step 7

------------------------------------------------------------------------

## 10. APPROVE/REJECT LEAVE (Faculty Only)

**Endpoint:**\
`PUT http://localhost:5000/api/leave/LEAVE_REQUEST_ID/status`

Headers:\
- Authorization: Bearer YOUR_JWT_TOKEN_HERE (Faculty token)\
- Content-Type: application/json

### Body (JSON) for Approval:

``` json
{
  "status": "Approved",
  "reviewComment": "Medical emergency approved. Please take care."
}
```

### Body (JSON) for Rejection:

``` json
{
  "status": "Rejected",
  "reviewComment": "Insufficient documentation provided."
}
```

------------------------------------------------------------------------

## 11. DASHBOARD STATISTICS

**Endpoint:**\
`GET http://localhost:5000/api/leave/statistics`

-   Student Response: Leave balance + total requests\
-   Faculty Response: Monthly stats, pending approvals, etc.

------------------------------------------------------------------------

## 12. FILE UPLOAD

**Endpoint:**\
`POST http://localhost:5000/api/leave/upload`

-   Headers: Authorization: Bearer YOUR_JWT_TOKEN_HERE\
-   Body Type: form-data

Form Data:\
- leaveRequestId: (text) YOUR_LEAVE_REQUEST_ID\
- attachments: (file) PDF/DOC/DOCX/JPG/PNG (max 5 files, 5MB each)

------------------------------------------------------------------------

## 13. DOWNLOAD ATTACHMENT

**Endpoint:**\
`GET http://localhost:5000/api/leave/LEAVE_REQUEST_ID/download/FILENAME`

Replace `LEAVE_REQUEST_ID` and `FILENAME` with actual values

------------------------------------------------------------------------

# 🧪 Testing Scenarios

### Complete Student Flow:

-   Register as student → Login → Create leave request → Upload file →
    View requests

### Complete Faculty Flow:

-   Register as faculty → Login → View all requests → Approve/reject →
    View statistics

### Error Testing:

-   Try accessing faculty routes with student token\
-   Try invalid dates in leave requests\
-   Test file upload limits

### Authentication Testing:

-   Try protected routes without token\
-   Try with expired/invalid tokens

------------------------------------------------------------------------

# 📊 API Response Structure

``` json
{
  "success": true/false,
  "message": "Description of result",
  "data": {
    // Actual response data
  }
}
```
