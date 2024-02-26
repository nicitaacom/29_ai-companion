# What in this docs?

- Usage for each route

  - Usage for auth/login route
  - Usage for auth/register route
  - Usage for chat/[chatId] route
  - Usage for companion/[companionId] route
  - Usage for companion route

<br/>
<br/>
<br/>

# Usage for each route

### Usage for auth/login route

1. Check is user with this email doesn't exist
2. Return info about providers to show error like 'You already have account with google - continue with google?'

### Usage for auth/register route

1. Check if user with this email already exists
2. Sign up to add row in 'auth.users'
3. Insert row in 'public.users' 'public.users_cart' tables (if user exist throw error)

### Usage for chat/[chatId] route

How it work:
ChatId is companion_id - so I load messages that .eq companion_id and .eq user.id
So users see their own messages with companion

1. For now idk what this route does

### Usage for companion/[companionId] route

1. Check is user authenticated and is required fields is missing
2. Update or delete based on request method that .eq companionId and .eq user.id (so only owner may update/delete)

### Usage for companion route

1. Check is user authenticated
2. Check is all required fields passed to this API route
3. Insert new companion in 'companion' table
