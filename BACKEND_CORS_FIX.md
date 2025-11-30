# Backend CORS Fix for SignalR

## Replace this code in Program.cs (around line 89-97):

```csharp
// ❌ OLD CODE - REMOVE THIS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FixItPolicy",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});
```

## With this:

```csharp
// ✅ NEW CODE - USE THIS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FixItPolicy",
        policyBuilder =>
        {
            policyBuilder.WithOrigins(
                    "http://localhost:4200",
                    "https://localhost:4200"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();  // ✅ Required for SignalR with JWT
        });
});
```

---

## Also add JWT support for SignalR (around line 184-202):

Find this section:
```csharp
builder.Services.AddAuthentication((options) => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer((options) =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Key"]!))
        };
    });
```

Replace with:
```csharp
builder.Services.AddAuthentication((options) => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer((options) =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Key"]!))
        };

        // ✅ ADD THIS - Enable JWT for SignalR WebSocket connections
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/notificationHub"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });
```

---

## Summary of Changes:

1. ✅ Changed `AllowAnyOrigin()` to `WithOrigins("http://localhost:4200", "https://localhost:4200")`
2. ✅ Added `.AllowCredentials()` (required for SignalR with authentication)
3. ✅ Added `OnMessageReceived` event to JWT configuration (for SignalR WebSocket support)

After making these changes:
1. Restart your backend server
2. Refresh your Angular app
3. Check browser console - should see: ✅ SignalR Connected Successfully
