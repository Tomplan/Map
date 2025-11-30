# Logo Upload System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Dashboard                          │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ BrandingSettings │         │  CompaniesTab    │            │
│  │                  │         │                  │            │
│  │  [Upload Logo]   │         │  [Upload Logo]   │            │
│  └────────┬─────────┘         └────────┬─────────┘            │
│           │                             │                       │
│           └──────────┬──────────────────┘                       │
│                      │                                          │
│                      ▼                                          │
│          ┌─────────────────────┐                               │
│          │   LogoUploader      │  ← Reusable Component         │
│          │   Component         │                               │
│          └──────────┬──────────┘                               │
│                     │                                           │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      ▼
          ┌──────────────────────┐
          │  logoUploadService   │  ← Service Layer
          │                      │
          │  • uploadLogo()      │
          │  • deleteLogo()      │
          │  • validateFile()    │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Supabase Client     │  ← SDK
          │  (@supabase/js)      │
          └──────────┬───────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                    Supabase Cloud                               │
│                                                                 │
│  ┌─────────────────┐         ┌────────────────────┐           │
│  │  Storage Bucket │         │   Database Tables  │           │
│  │     'logos'     │         │                    │           │
│  │                 │         │  • Companies       │           │
│  │  companies/     │◄────────┤  • Branding        │           │
│  │  ├─ logo1.png   │         │  • Assignments     │           │
│  │  ├─ logo2.jpg   │         │                    │           │
│  │  └─ ...         │         │  (stores logo URL) │           │
│  │                 │         └────────────────────┘           │
│  │  events/        │                                           │
│  │  ├─ event1.png  │         ┌────────────────────┐           │
│  │  └─ ...         │         │   RLS Policies     │           │
│  │                 │         │                    │           │
│  │  test/          │         │  • Public read     │           │
│  │  └─ ...         │         │  • Auth write      │           │
│  └─────────────────┘         └────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   Public CDN URLs    │  ← Delivered to users
          │  (publicly readable) │
          └──────────────────────┘
```

## Data Flow

### Upload Flow
```
1. User clicks "Upload Logo"
   ↓
2. LogoUploader opens file picker
   ↓
3. User selects image file
   ↓
4. validateLogoFile() checks:
   • File type (PNG, JPG, etc.)
   • File size (< 5MB)
   ↓
5. uploadLogo() generates unique filename
   ↓
6. Supabase SDK uploads to Storage
   ↓
7. Supabase returns public URL
   ↓
8. Component calls onUploadComplete(url, path)
   ↓
9. Parent component updates state
   ↓
10. Database updated with new logo URL
```

### Read Flow
```
1. Component needs to display logo
   ↓
2. Fetch company/branding data from DB
   ↓
3. Logo URL retrieved (could be Supabase or local)
   ↓
4. getLogoPath() resolves full URL
   ↓
5. <img> tag displays logo from CDN
```

### Delete Flow
```
1. User clicks delete button
   ↓
2. extractStoragePath() gets file path from URL
   ↓
3. deleteLogo() removes from Storage
   ↓
4. Component updates database (logo = null)
   ↓
5. UI updates to show no logo
```

## Component Hierarchy

```
AdminDashboard
├── BrandingSettings
│   └── LogoUploader (folder="events")
│       └── logoUploadService
│           └── supabase.storage
│
└── CompaniesTab
    ├── Create Form
    │   └── LogoUploader (folder="companies")
    │       └── logoUploadService
    │           └── supabase.storage
    │
    └── Edit Mode
        └── LogoUploader (folder="companies")
            └── logoUploadService
                └── supabase.storage
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│ 1. Client-Side Validation                  │
│    • File type check                        │
│    • File size check                        │
│    • MIME type validation                   │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 2. Authentication Check                     │
│    • Must be logged in                      │
│    • JWT token verification                 │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 3. Supabase RLS Policies                   │
│    • Public: SELECT only                    │
│    • Authenticated: INSERT, DELETE          │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 4. Storage Bucket Settings                  │
│    • Size limits enforced                   │
│    • MIME type whitelist                    │
│    • Rate limiting                          │
└─────────────────────────────────────────────┘
```

## File Organization Structure

```
Supabase Storage: logos/
│
├── companies/                  ← Company logos
│   ├── 1699635420123_a7f3d2.png
│   ├── 1699635421456_b8g4e3.jpg
│   ├── 1699635422789_c9h5f4.avif
│   └── ...
│
├── events/                     ← Event/branding logos
│   ├── 1699635423012_d0i6g5.png
│   ├── 1699635424345_e1j7h6.webp
│   └── ...
│
└── test/                       ← Test uploads
    ├── 1699635425678_f2k8i7.png
    └── ...
```

## State Management

```
Component State:
├── currentLogo (string)        ← Current logo URL
├── uploading (boolean)         ← Upload in progress?
├── uploadStatus (string)       ← 'success' | 'error' | null
└── statusMessage (string)      ← User-facing message

Service State:
├── File validation result
├── Upload progress
└── Error messages

Supabase State:
├── Storage: Physical files
├── Database: Logo URLs
└── Auth: User session
```

## Error Handling Chain

```
LogoUploader Component
    ↓ (try/catch)
logoUploadService
    ↓ (error checking)
Supabase SDK
    ↓ (network errors)
Supabase API
    ↓ (server errors)
Storage Bucket

Each layer returns:
{ error: string } or { success: true, data: ... }
```

## Integration Points

### 1. BrandingSettings Integration
```jsx
const [logo, setLogo] = useState(initialLogo);

<LogoUploader
  currentLogo={logo}
  onUploadComplete={(url) => {
    setLogo(url);
    saveToDB({ logo: url });
  }}
  folder="events"
/>
```

### 2. CompaniesTab Integration
```jsx
const [companyForm, setCompanyForm] = useState({});

<LogoUploader
  currentLogo={companyForm.logo}
  onUploadComplete={(url) => {
    setCompanyForm({ ...companyForm, logo: url });
  }}
  folder="companies"
/>
```

### 3. Database Update
```javascript
// After upload succeeds
await supabase
  .from('Companies')
  .update({ logo: newLogoUrl })
  .eq('id', companyId);
```

## Performance Considerations

```
Optimization Strategy:
├── File upload: Async, non-blocking UI
├── Image preview: Lazy loading
├── CDN delivery: Cached by Supabase
├── Database queries: Indexed logo columns
└── Client caching: LocalStorage for frequently used logos
```

## Testing Strategy

```
1. Unit Tests (Future)
   ├── validateLogoFile()
   ├── extractStoragePath()
   └── uploadLogo() (mocked)

2. Integration Tests
   ├── StorageTestPage (manual)
   └── Upload → Display → Delete flow

3. E2E Tests (Future)
   └── Complete admin workflow
```

---

This architecture ensures:
- ✅ Scalability (cloud storage)
- ✅ Security (multiple validation layers)
- ✅ Maintainability (separation of concerns)
- ✅ Reusability (component-based)
- ✅ User Experience (visual feedback)
