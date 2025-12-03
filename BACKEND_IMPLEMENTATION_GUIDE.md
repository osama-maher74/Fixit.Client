# Egyptian National ID Verification - Backend Implementation Guide

## ⚠️ IMPORTANT SECURITY NOTICE

**NEVER** store your OpenAI API key in the frontend `environment.ts` file!
The key in your environment file appears to be an OpenAI secret key (`sk-proj-...`). This MUST be moved to your backend immediately.

---

## 📋 Overview

This guide provides step-by-step instructions to implement the backend API for Egyptian National ID verification using OpenAI's Vision API.

## 🔧 Prerequisites

- .NET 6.0 or higher
- OpenAI API Key (sign up at https://platform.openai.com/)
- Access to your backend project

---

## 🚀 Implementation Steps

### Step 1: Install Required NuGet Packages

```bash
dotnet add package Microsoft.AspNetCore.Http
dotnet add package System.Text.Json
```

### Step 2: Configure API Key in appsettings.json

**File:** `appsettings.json` or `appsettings.Development.json`

```json
{
  "OpenAI": {
    "ApiKey": "sk-proj-YOUR_ACTUAL_OPENAI_API_KEY_HERE",
    "Model": "gpt-4o",
    "MaxTokens": 1000
  },
  "IdVerification": {
    "MaxFileSizeMB": 5,
    "AllowedFormats": ["image/jpeg", "image/jpg", "image/png"]
  }
}
```

**⚠️ CRITICAL:** Add this file to `.gitignore` to prevent committing your API key:

```gitignore
appsettings.Development.json
appsettings.Production.json
*.user
```

---

### Step 3: Create DTOs and Models

**File:** `Models/IdVerification/IdVerificationRequest.cs`

```csharp
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace YourNamespace.Models.IdVerification
{
    public class IdVerificationRequest
    {
        [Required(ErrorMessage = "Front image is required")]
        public IFormFile FrontImage { get; set; } = null!;

        [Required(ErrorMessage = "Back image is required")]
        public IFormFile BackImage { get; set; } = null!;
    }
}
```

**File:** `Models/IdVerification/IdVerificationResponse.cs`

```csharp
namespace YourNamespace.Models.IdVerification
{
    public class IdVerificationResponse
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<string> Errors { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
        public ExtractedData ExtractedData { get; set; } = new();
    }

    public class ExtractedData
    {
        public string? FullName { get; set; }
        public string? NationalIdNumber { get; set; }
        public string? ExpiryDate { get; set; }
        public bool IsExpired { get; set; }
    }
}
```

**File:** `Models/OpenAI/OpenAIModels.cs`

```csharp
using System.Text.Json.Serialization;

namespace YourNamespace.Models.OpenAI
{
    public class OpenAIRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = "gpt-4o";

        [JsonPropertyName("messages")]
        public List<OpenAIMessage> Messages { get; set; } = new();

        [JsonPropertyName("max_tokens")]
        public int MaxTokens { get; set; } = 1000;

        [JsonPropertyName("temperature")]
        public double Temperature { get; set; } = 0.1;
    }

    public class OpenAIMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = "user";

        [JsonPropertyName("content")]
        public List<MessageContent> Content { get; set; } = new();
    }

    public class MessageContent
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "text";

        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("image_url")]
        public ImageUrl? ImageUrl { get; set; }
    }

    public class ImageUrl
    {
        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;
    }

    public class OpenAIResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("choices")]
        public List<Choice> Choices { get; set; } = new();

        [JsonPropertyName("usage")]
        public Usage? Usage { get; set; }
    }

    public class Choice
    {
        [JsonPropertyName("message")]
        public ResponseMessage Message { get; set; } = new();

        [JsonPropertyName("finish_reason")]
        public string FinishReason { get; set; } = string.Empty;
    }

    public class ResponseMessage
    {
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    public class Usage
    {
        [JsonPropertyName("prompt_tokens")]
        public int PromptTokens { get; set; }

        [JsonPropertyName("completion_tokens")]
        public int CompletionTokens { get; set; }

        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }
    }
}
```

---

### Step 4: Create OpenAI Service

**File:** `Services/OpenAIService.cs`

```csharp
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using YourNamespace.Models.IdVerification;
using YourNamespace.Models.OpenAI;

namespace YourNamespace.Services
{
    public interface IOpenAIService
    {
        Task<IdVerificationResponse> VerifyEgyptianNationalIdAsync(
            byte[] frontImageBytes,
            byte[] backImageBytes);
    }

    public class OpenAIService : IOpenAIService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly int _maxTokens;
        private readonly ILogger<OpenAIService> _logger;

        public OpenAIService(
            IConfiguration configuration,
            ILogger<OpenAIService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient("OpenAI");
            _apiKey = configuration["OpenAI:ApiKey"]
                ?? throw new InvalidOperationException("OpenAI API key not configured");
            _model = configuration["OpenAI:Model"] ?? "gpt-4o";
            _maxTokens = int.Parse(configuration["OpenAI:MaxTokens"] ?? "1000");
            _logger = logger;

            _httpClient.BaseAddress = new Uri("https://api.openai.com/v1/");
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        public async Task<IdVerificationResponse> VerifyEgyptianNationalIdAsync(
            byte[] frontImageBytes,
            byte[] backImageBytes)
        {
            try
            {
                // Convert images to base64
                var frontBase64 = $"data:image/jpeg;base64,{Convert.ToBase64String(frontImageBytes)}";
                var backBase64 = $"data:image/jpeg;base64,{Convert.ToBase64String(backImageBytes)}";

                // Prepare request
                var request = new OpenAIRequest
                {
                    Model = _model,
                    MaxTokens = _maxTokens,
                    Temperature = 0.1,
                    Messages = new List<OpenAIMessage>
                    {
                        new OpenAIMessage
                        {
                            Role = "user",
                            Content = new List<MessageContent>
                            {
                                new MessageContent
                                {
                                    Type = "text",
                                    Text = GetVerificationPrompt()
                                },
                                new MessageContent
                                {
                                    Type = "image_url",
                                    ImageUrl = new ImageUrl { Url = frontBase64 }
                                },
                                new MessageContent
                                {
                                    Type = "image_url",
                                    ImageUrl = new ImageUrl { Url = backBase64 }
                                }
                            }
                        }
                    }
                };

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("chat/completions", content);
                response.EnsureSuccessStatusCode();

                var responseBody = await response.Content.ReadAsStringAsync();
                var openAiResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseBody);

                if (openAiResponse?.Choices == null || openAiResponse.Choices.Count == 0)
                {
                    throw new Exception("No response from OpenAI API");
                }

                var aiContent = openAiResponse.Choices[0].Message.Content;

                // Extract JSON from response (AI might wrap it in markdown)
                var jsonMatch = Regex.Match(aiContent, @"\{[\s\S]*\}", RegexOptions.Multiline);
                var jsonContent = jsonMatch.Success ? jsonMatch.Value : aiContent;

                var verificationResult = JsonSerializer.Deserialize<IdVerificationResponse>(
                    jsonContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return verificationResult ?? new IdVerificationResponse
                {
                    IsValid = false,
                    Message = "Failed to parse verification result",
                    Errors = new List<string> { "Invalid response format from AI" }
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error calling OpenAI API");
                return new IdVerificationResponse
                {
                    IsValid = false,
                    Message = "Verification service error. Please try again later.",
                    Errors = new List<string> { ex.Message }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying national ID");
                return new IdVerificationResponse
                {
                    IsValid = false,
                    Message = "An unexpected error occurred during verification.",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        private string GetVerificationPrompt()
        {
            return @"You are an expert Egyptian National ID verification system. Analyze the two provided images (front and back of an Egyptian National ID card) and determine if they meet all verification requirements.

VALIDATION RULES:

1. IMAGE QUALITY REQUIREMENTS:
   - Both images must be clear and well-lit
   - Text must be fully readable without blurriness
   - Images must not be cropped or cut off
   - The ID card must not be covered, damaged, or rotated
   - No glare or shadows obscuring text
   - Both photos must show a complete ID card

2. DOCUMENT TYPE VERIFICATION:
   - Must be a valid Egyptian National ID (البطاقة الشخصية المصرية)
   - Not a passport, driver's license, or any other document
   - Must contain the Egyptian national emblem/logo

3. REQUIRED FIELDS VERIFICATION (Front):
   - Full Name (in Arabic)
   - National ID Number (14 digits)
   - Date of Birth
   - Gender
   - Governorate
   - Marital Status
   - Religion
   - Photo of the cardholder

4. REQUIRED FIELDS VERIFICATION (Back):
   - Job/Profession
   - Address
   - Issue Date
   - Expiry Date
   - National ID Number (must match front)

5. VALIDITY CHECKS:
   - The ID must NOT be expired (check expiry date against today's date)
   - Front and back photos must belong to the SAME card
   - National ID number on front must EXACTLY match the number on back
   - Personal information must be consistent across both sides

6. AUTHENTICITY INDICATORS:
   - Check for security features typical of Egyptian IDs
   - Look for signs of tampering or photo manipulation
   - Verify the card layout matches official Egyptian ID format

RESPONSE FORMAT:
Return ONLY a valid JSON object with NO additional text, markdown, or explanation:

{
  ""isValid"": true/false,
  ""message"": ""Brief explanation of the verification result"",
  ""errors"": [
    ""List specific issues found (empty array if valid)""
  ],
  ""warnings"": [
    ""List potential concerns that don't invalidate the ID (empty array if none)""
  ],
  ""extractedData"": {
    ""fullName"": ""Name from ID or null"",
    ""nationalIdNumber"": ""14-digit number or null"",
    ""expiryDate"": ""Date in YYYY-MM-DD format or null"",
    ""isExpired"": true/false
  }
}

IMPORTANT:
- Be strict with validation rules
- If ANY required field is missing or unreadable, set isValid to false
- If the ID is expired, set isValid to false
- If front and back don't match, set isValid to false
- Provide clear, specific error messages in English
- Include extracted data even if validation fails (when possible)";
        }
    }
}
```

---

### Step 5: Create Verification API Endpoint

**File:** `Controllers/CraftsmanController.cs` (add this method)

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using YourNamespace.Data;
using YourNamespace.Models.IdVerification;
using YourNamespace.Services;

namespace YourNamespace.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CraftsmanController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IOpenAIService _openAIService;
        private readonly ILogger<CraftsmanController> _logger;

        public CraftsmanController(
            ApplicationDbContext context,
            IOpenAIService openAIService,
            ILogger<CraftsmanController> logger)
        {
            _context = context;
            _openAIService = openAIService;
            _logger = logger;
        }

        [HttpPost("verify-national-id")]
        [Authorize] // Require authentication
        public async Task<IActionResult> VerifyNationalId([FromForm] IdVerificationRequest request)
        {
            try
            {
                // 1. Validate file uploads
                if (request.FrontImage == null || request.BackImage == null)
                {
                    return BadRequest(new { message = "Both front and back images are required" });
                }

                // 2. Validate file size (5MB max)
                const long maxFileSize = 5 * 1024 * 1024;
                if (request.FrontImage.Length > maxFileSize || request.BackImage.Length > maxFileSize)
                {
                    return BadRequest(new { message = "Image size must be less than 5MB" });
                }

                // 3. Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png" };
                if (!allowedTypes.Contains(request.FrontImage.ContentType) ||
                    !allowedTypes.Contains(request.BackImage.ContentType))
                {
                    return BadRequest(new { message = "Only JPG and PNG images are allowed" });
                }

                // 4. Get craftsman email from JWT token
                var email = User.FindFirst(ClaimTypes.Email)?.Value;
                if (string.IsNullOrEmpty(email))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var craftsman = await _context.Craftsmen
                    .FirstOrDefaultAsync(c => c.Email == email);

                if (craftsman == null)
                {
                    return NotFound(new { message = "Craftsman not found" });
                }

                // 5. Check if already verified
                if (craftsman.IsVerified)
                {
                    return BadRequest(new { message = "Craftsman is already verified" });
                }

                // 6. Convert images to byte arrays
                byte[] frontBytes;
                byte[] backBytes;

                using (var ms = new MemoryStream())
                {
                    await request.FrontImage.CopyToAsync(ms);
                    frontBytes = ms.ToArray();
                }

                using (var ms = new MemoryStream())
                {
                    await request.BackImage.CopyToAsync(ms);
                    backBytes = ms.ToArray();
                }

                // 7. Call OpenAI Vision API
                var verificationResult = await _openAIService.VerifyEgyptianNationalIdAsync(
                    frontBytes,
                    backBytes);

                // 8. If valid, update craftsman verification status
                if (verificationResult.IsValid)
                {
                    craftsman.IsVerified = true;
                    craftsman.VerifiedAt = DateTime.UtcNow;

                    // Optional: Store extracted National ID number
                    if (!string.IsNullOrEmpty(verificationResult.ExtractedData.NationalIdNumber))
                    {
                        craftsman.NationalIdNumber = verificationResult.ExtractedData.NationalIdNumber;
                    }

                    // Optional: Save ID images securely
                    // craftsman.NationalIdFrontImage = await SaveIdImageAsync(request.FrontImage, craftsman.Id, "front");
                    // craftsman.NationalIdBackImage = await SaveIdImageAsync(request.BackImage, craftsman.Id, "back");

                    await _context.SaveChangesAsync();

                    _logger.LogInformation(
                        "Craftsman {Email} verified successfully with ID {IdNumber}",
                        email,
                        verificationResult.ExtractedData.NationalIdNumber);
                }
                else
                {
                    _logger.LogWarning(
                        "ID verification failed for craftsman {Email}. Errors: {Errors}",
                        email,
                        string.Join(", ", verificationResult.Errors));
                }

                // 9. Return verification result
                return Ok(verificationResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying national ID");
                return StatusCode(500, new { message = "Verification service error. Please try again later." });
            }
        }

        // Optional: Save ID images securely
        private async Task<string> SaveIdImageAsync(IFormFile image, int craftsmanId, string side)
        {
            var uploadsFolder = Path.Combine("wwwroot", "secure-uploads", "national-ids");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"craftsman_{craftsmanId}_id_{side}_{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            return filePath;
        }
    }
}
```

---

### Step 6: Register Services in Program.cs (or Startup.cs)

```csharp
// Add these lines to your service configuration

// Register HttpClientFactory
builder.Services.AddHttpClient("OpenAI");

// Register OpenAI Service
builder.Services.AddScoped<IOpenAIService, OpenAIService>();
```

---

### Step 7: Update Database Model

Add these properties to your `Craftsman` entity:

```csharp
public class Craftsman
{
    // ... existing properties ...

    public bool IsVerified { get; set; } = false;
    public DateTime? VerifiedAt { get; set; }
    public string? NationalIdNumber { get; set; }

    // Optional: Store ID image paths
    public string? NationalIdFrontImage { get; set; }
    public string? NationalIdBackImage { get; set; }
}
```

Then create and apply a migration:

```bash
dotnet ef migrations add AddIdVerificationFields
dotnet ef database update
```

---

## 🧪 Testing

### Test with Postman or cURL:

```bash
curl -X POST "https://localhost:7058/api/Craftsman/verify-national-id" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "frontImage=@front_id.jpg" \
  -F "backImage=@back_id.jpg"
```

### Expected Response (Success):

```json
{
  "isValid": true,
  "message": "Egyptian National ID verified successfully.",
  "errors": [],
  "warnings": [],
  "extractedData": {
    "fullName": "أحمد محمد علي",
    "nationalIdNumber": "29508151234567",
    "expiryDate": "2028-05-15",
    "isExpired": false
  }
}
```

### Expected Response (Failure):

```json
{
  "isValid": false,
  "message": "ID verification failed due to poor image quality.",
  "errors": [
    "Front image is too blurry - text is not clearly readable",
    "Back image has glare obscuring the expiry date"
  ],
  "warnings": [],
  "extractedData": {
    "fullName": null,
    "nationalIdNumber": null,
    "expiryDate": null,
    "isExpired": false
  }
}
```

---

## 💰 Cost Considerations

- OpenAI GPT-4o with Vision costs approximately **$0.01 per image**
- Each verification = 2 images = ~**$0.02 per verification**
- Monitor usage in your OpenAI dashboard: https://platform.openai.com/usage

---

## 🔒 Security Best Practices

1. **API Key Security**
   - Store API key in environment variables in production
   - Never commit `appsettings.*.json` files with secrets
   - Use Azure Key Vault or AWS Secrets Manager in production

2. **Rate Limiting**
   - Implement rate limiting to prevent abuse
   - Limit verifications to 3 attempts per hour per user

3. **Image Security**
   - Store ID images in a secure location outside `wwwroot`
   - Implement access control (only admin/owner can view)
   - Consider encrypting stored images
   - Auto-delete images after verification (if legal)

4. **CORS**
   - Configure CORS properly to only allow your frontend domain

---

## 📊 Monitoring

Add logging to track:
- Verification success rate
- Most common rejection reasons
- Average verification time
- API costs per verification

Example:

```csharp
_logger.LogInformation(
    "ID Verification - Craftsman: {CraftsmanId}, IsValid: {IsValid}, Cost: ${Cost}, Time: {Time}ms",
    craftsman.Id,
    verificationResult.IsValid,
    0.02, // Cost per verification
    stopwatch.ElapsedMilliseconds);
```

---

## ✅ Checklist

- [ ] OpenAI API key configured in appsettings.json
- [ ] appsettings.json added to .gitignore
- [ ] All DTOs and models created
- [ ] OpenAIService implemented
- [ ] Verification endpoint added to CraftsmanController
- [ ] HttpClient registered in Program.cs
- [ ] OpenAIService registered in DI container
- [ ] Database migration created and applied
- [ ] Tested with real ID images
- [ ] Logging implemented
- [ ] Rate limiting configured (optional but recommended)
- [ ] CORS configured

---

## 🆘 Troubleshooting

### Issue: "OpenAI API key not configured"
**Solution:** Check that your API key is properly set in `appsettings.json` and starts with `sk-`

### Issue: "401 Unauthorized from OpenAI"
**Solution:** Verify your API key is correct and has sufficient credits

### Issue: "Model 'gpt-4o' does not exist"
**Solution:** Your account may not have access to GPT-4o. Try using `"gpt-4-vision-preview"` instead

### Issue: "Image too large" errors
**Solution:** Reduce image size before sending to OpenAI (resize to max 1920x1080)

---

## 📚 Additional Resources

- [OpenAI Vision API Documentation](https://platform.openai.com/docs/guides/vision)
- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [Egyptian National ID Format](https://en.wikipedia.org/wiki/Egyptian_identity_card)

---

## 🎉 You're All Set!

The frontend is already implemented and ready. Once you complete this backend implementation:

1. Update the API key in `appsettings.json`
2. Run the backend server
3. Login as a craftsman
4. Navigate to Edit Profile
5. Upload your Egyptian National ID (front + back)
6. Click "Verify My ID"
7. Wait 5-15 seconds for AI verification
8. See your verified badge! ✅

---

**Need Help?** Refer to the original detailed guide or ask for clarification on any step.
