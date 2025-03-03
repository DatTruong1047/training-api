### Mini Project 1: Todo API
**Yêu cầu:**
1. Tạo CRUD API cho Todo items
    -  get : api/tasks
    -  post: api/tasks
    -  put : api/tasks/:id
    -  delete : api/tasks/:id

2. Mỗi todo có: title, description, status, dueDate
3. Thêm tính năng search và filter:

    - Filter và search theo status, title, dueDate
        +  get: api/tasks?dueDate={date}&status=completed&title=note
        
    - Tìm kiếm các tasks cua 1 user theo id và filter
        + get : api/users/:user_id/tasks?dueDate=2025-11-27T00:00:00.000Z&status=completed&title=note
 
4. Implement authentication

5. Add validation