# Static Build Alternative

If you want to deploy a simplified version without real-time features on static hosts like Netlify or Vercel, here are the changes needed:

## Changes Required for Static Deployment

1. **Remove Socket.IO dependency** - Replace with HTTP polling
2. **Remove file upload server** - Use client-side only uploads
3. **Use localStorage** for message persistence instead of server storage
4. **Remove Express server** - Build as pure React SPA

## Build Commands for Static Deployment

```bash
# Build frontend only
npm run build

# Deploy dist/public folder to:
# - Netlify: drag & drop dist/public folder
# - Vercel: connect repo and set output directory to "dist/public"  
# - GitHub Pages: copy contents of dist/public to docs folder
```

## Trade-offs of Static Deployment

**Lost Features:**
- ❌ Real-time messaging (Socket.IO)
- ❌ Server-side file upload processing
- ❌ Cross-user synchronization
- ❌ User join notifications
- ❌ Online user count

**Keeps:**
- ✅ Chat interface and styling
- ✅ Multi-language support
- ✅ Local message storage
- ✅ Orange Lycanroc theme

**For the full LycanChat experience with real-time features, use Replit deployment instead.**