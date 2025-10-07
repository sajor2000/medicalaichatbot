# Medical AI Patient Interview System - UX Audit Report
**Date:** October 7, 2025
**Deployment:** https://rushm1chatbot1.vercel.app/
**Audited by:** Claude Code

---

## Executive Summary

### ✅ Critical Requirements Met
- ✅ **No "Key Facts" sidebar** - Students cannot see what they need to elicit
- ✅ **Grading visible** - Badges show Completeness, Empathy, and Facts count
- ✅ **Text input uses `onKeyDown`** - Should show real-time typing
- ✅ **Clear Text/Voice mode switcher** - Easy to toggle between modes
- ✅ **Good information architecture** - Clean, focused on the task

### ⚠️ Issues Found (Code Review)

**Priority Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

##  1. Interview Page Layout Issue 🟠 **HIGH**

**Issue:** Chat area height may not work correctly on all screen sizes

**Current Code (Line 194):**
```tsx
<Card className="flex-1 flex flex-col overflow-hidden h-full">
```

**Problem:** Using both `flex-1` and `h-full` can cause conflicts. The parent div doesn't have a fixed height.

**Fix:**
```tsx
// Update line 192-194
<Card className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
```

**Impact:** Chat messages may not scroll properly, students might miss content

---

## 2. Grading Badges Hidden Initially 🟡 **MEDIUM**

**Issue:** Grading only appears after 3+ messages (line 151)

**Current Code:**
```tsx
{messages.length > 3 && (
  <div className="flex items-center gap-2">
    <Badge>Completeness: {completeness}/5</Badge>
    // ...
  </div>
)}
```

**Problem:** Students don't see grading UI until they've already had a conversation

**Recommendation:** Show badges immediately with "-" or "0" values
```tsx
<div className="flex items-center gap-2">
  <Badge variant="secondary" className="gap-1">
    <span className="text-xs">Completeness:</span>
    <span className="font-semibold">{completeness > 0 ? `${completeness}/5` : '-'}</span>
  </Badge>
  // ... same for others
</div>
```

**Impact:** Better user awareness of what they're being graded on

---

## 3. No Error Feedback for Failed Messages 🟠 **HIGH**

**Issue:** When AI response fails, error message is generic (line 126)

**Current Code:**
```tsx
setMessages((prev) => [
  ...prev,
  { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
]);
```

**Problems:**
- No retry mechanism
- Student loses their question
- No indication of what went wrong

**Recommended Fix:**
```tsx
catch (error) {
  console.error('Error:', error);
  setMessages((prev) => [
    ...prev,
    {
      role: 'assistant',
      content: `I'm having trouble responding right now. Your question was: "${input.trim()}"\n\nPlease try asking again, or click the button below to retry.`
    },
  ]);
  // Add retry button state
}
```

---

## 4. Voice Mode - No Clear Feedback 🟠 **HIGH**

**Issue:** Voice mode may not show clear status to students

**Recommendations:**
1. Add visual indicator when mic is listening
2. Show AI is "thinking" before speaking
3. Display text transcript of what student said
4. Show text transcript of AI response

**Current:** VoiceClient has status text, but may not be prominent enough

**Suggested Enhancement:**
- Larger, more visible status indicator
- Color-coded states (listening=green, processing=blue, speaking=purple)
- Toast notifications for mic permissions

---

## 5. Input Field Accessibility 🟡 **MEDIUM**

**Current Implementation (Line 233-240):**
```tsx
<Input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyPress}
  placeholder="Ask your question..."
  disabled={isLoading}
  className="flex-1"
/>
```

**Missing:**
- `aria-label` for screen readers
- `autoFocus` when page loads (so students can type immediately)
- `autoComplete="off"` to prevent browser suggestions
- Max length validation (prevent extremely long questions)

**Recommended Fix:**
```tsx
<Input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyPress}
  placeholder="Ask your question..."
  disabled={isLoading}
  className="flex-1"
  aria-label="Type your question to the patient"
  autoFocus
  autoComplete="off"
  maxLength={500}
/>
```

---

## 6. Send Button Accessibility 🟡 **MEDIUM**

**Current (Line 241-243):**
```tsx
<Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
  <Send className="w-4 h-4" />
</Button>
```

**Missing:**
- `aria-label` for screen readers
- Visible text label (icon-only buttons are hard to understand)

**Recommended:**
```tsx
<Button
  onClick={sendMessage}
  disabled={isLoading || !input.trim()}
  aria-label="Send message"
>
  {isLoading ? (
    <>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      Sending...
    </>
  ) : (
    <>
      <Send className="w-4 h-4 mr-2" />
      Send
    </>
  )}
</Button>
```

---

## 7. Mobile Responsiveness 🟡 **MEDIUM**

**Issue:** Header might be cramped on mobile devices

**Current Header (Lines 144-189):** Uses `flex justify-between` with multiple elements

**Problem on Mobile (<768px):**
- Grading badges + mode switcher might wrap awkwardly
- Text might be too small

**Recommended:**
```tsx
<header className="bg-white border-b border-gray-200 px-4 py-3">
  <div className="max-w-6xl mx-auto">
    {/* Row 1: Title and mode switcher */}
    <div className="flex items-center justify-between mb-2">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-900">
          Ms. Esposito Interview
        </h1>
      </div>
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
        {/* Mode switcher */}
      </div>
    </div>

    {/* Row 2: Session + Grading (only if messages > 3) */}
    <div className="flex items-center justify-between text-sm">
      <p className="text-gray-600">Session: {sessionId.slice(0, 8)}...</p>
      {messages.length > 3 && (
        <div className="flex items-center gap-2">
          {/* Grading badges */}
        </div>
      )}
    </div>
  </div>
</header>
```

---

## 8. No Session Recovery 🟢 **LOW**

**Issue:** If student refreshes page, conversation is lost

**Current:** No persistence beyond in-memory state

**Recommendation (Future Enhancement):**
- Save conversation to localStorage every message
- On page load, check for existing session
- Offer "Resume" or "Start New" option

---

## 9. No Help/Instructions in Interview 🟢 **LOW**

**Issue:** Once in interview, students have no guidance

**Recommendation:**
Add a help icon/button in header that shows a modal:
- Tips for good questions (OPQRST framework)
- What completeness/empathy scores mean
- How to switch between text/voice
- Technical requirements for voice mode

---

## 10. Message Display - Timestamp Missing 🟢 **LOW**

**Issue:** No timestamps on messages

**Benefit:** Students can see how long interview took

**Suggested Addition:**
```tsx
<div className="text-xs font-semibold mb-1 flex items-center justify-between">
  <span>{msg.role === 'user' ? 'You' : 'Ms. Esposito'}</span>
  <span className="text-gray-400 font-normal">
    {new Date(msg.timestamp).toLocaleTimeString()}
  </span>
</div>
```

---

## ✅ Strengths

1. **Clean, focused UI** - No distractions from the core task
2. **Good visual hierarchy** - Important elements are prominent
3. **Responsive layout** - Uses Tailwind breakpoints
4. **Proper state management** - React hooks used correctly
5. **Error handling exists** - Catch blocks in place
6. **Loading states** - Button shows "Loading..." feedback
7. **Streaming responses** - AI responses appear progressively
8. **Auto-scroll** - Messages scroll to bottom automatically
9. **Clear role differentiation** - User vs AI messages visually distinct
10. **No "cheat sheet"** - Students must think critically

---

## Critical Fixes to Implement NOW

### Priority 1: Must Fix Before Students Use 🔴

1. **Fix chat area height** - Ensure messages scroll properly
2. **Add input autoFocus** - Students can type immediately
3. **Improve error messages** - Give actionable feedback
4. **Add send button text** - "Send" label alongside icon

### Priority 2: Should Fix This Week 🟠

5. **Show grading badges immediately** - Set expectations early
6. **Mobile responsive header** - Test on phones/tablets
7. **Voice mode status improvements** - Clearer feedback

### Priority 3: Nice to Have 🟡

8. **Add help/instructions modal**
9. **Implement session recovery**
10. **Add message timestamps**

---

## Testing Checklist for https://rushm1chatbot1.vercel.app/

### Homepage Tests
- [ ] Page loads without errors
- [ ] "Start Interview" button is visible and prominent
- [ ] Button shows loading state when clicked
- [ ] Navigates to interview page successfully
- [ ] Mobile view looks good (test on phone)

### Text Mode Tests
- [ ] Input field is focused when page loads
- [ ] Can see characters as you type (real-time feedback)
- [ ] Pressing Enter sends message
- [ ] Send button is disabled when input is empty
- [ ] Send button is disabled while loading
- [ ] User messages appear in blue on right
- [ ] AI messages appear in gray on left
- [ ] Messages scroll to bottom automatically
- [ ] Streaming response shows character-by-character
- [ ] Error messages display if API fails

### Voice Mode Tests
- [ ] Click "Voice" tab switches to voice interface
- [ ] "Start Voice Mode" button is visible
- [ ] Browser asks for microphone permission
- [ ] Status shows "Listening..." when active
- [ ] Spoken words appear as text transcript
- [ ] AI response plays through speakers
- [ ] AI response also shows as text
- [ ] Can mute/unmute microphone
- [ ] Can toggle speaker on/off
- [ ] "End Session" button stops voice mode

### Grading Display Tests
- [ ] Completeness badge shows after 3+ messages
- [ ] Empathy badge shows after 3+ messages
- [ ] Facts counter shows X/11 format
- [ ] Badges update in real-time after each response
- [ ] **No "Key Facts to Elicit" list is visible anywhere** ✅

### Responsive Design Tests
- [ ] Desktop (1920x1080) - all elements visible
- [ ] Laptop (1366x768) - no horizontal scroll
- [ ] Tablet (768x1024) - header doesn't wrap badly
- [ ] Mobile (375x667) - readable text, usable buttons
- [ ] Mobile landscape - chat area has good height

### Accessibility Tests
- [ ] Tab through elements in logical order
- [ ] Screen reader announces input field purpose
- [ ] Screen reader announces button labels
- [ ] Color contrast meets WCAG AA (4.5:1 ratio)
- [ ] Can use entire app with keyboard only

### Performance Tests
- [ ] Page loads in <3 seconds
- [ ] Text response starts streaming in <2 seconds
- [ ] Voice response starts in <3 seconds
- [ ] No lag when typing in input field
- [ ] Scrolling is smooth with 50+ messages

---

## Recommended Code Changes

### 1. Fix Interview Page Height

**File:** `/Users/JCR/Desktop/ai_med/frontend/app/interview/[sessionId]/page.tsx`

**Line 191-194, change from:**
```tsx
<div className="flex-1 max-w-4xl w-full mx-auto p-4">
  <Card className="flex-1 flex flex-col overflow-hidden h-full">
```

**To:**
```tsx
<div className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col">
  <Card className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 10rem)' }}>
```

### 2. Add Input Field Enhancements

**Line 233-240, change from:**
```tsx
<Input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyPress}
  placeholder="Ask your question..."
  disabled={isLoading}
  className="flex-1"
/>
```

**To:**
```tsx
<Input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyPress}
  placeholder="Ask your question..."
  disabled={isLoading}
  className="flex-1 text-base"
  aria-label="Type your question to the patient"
  autoFocus
  autoComplete="off"
  maxLength={500}
/>
```

### 3. Improve Send Button

**Line 241-243, change from:**
```tsx
<Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
  <Send className="w-4 h-4" />
</Button>
```

**To:**
```tsx
<Button
  onClick={sendMessage}
  disabled={isLoading || !input.trim()}
  aria-label="Send message"
  size="lg"
>
  {isLoading ? (
    <>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      <span className="hidden sm:inline">Sending...</span>
    </>
  ) : (
    <>
      <Send className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Send</span>
    </>
  )}
</Button>
```

### 4. Show Grading Immediately

**Line 151-166, change from:**
```tsx
{messages.length > 3 && (
  <div className="flex items-center gap-2">
    // badges
  </div>
)}
```

**To:**
```tsx
<div className="flex items-center gap-2">
  <Badge variant={completeness >= 3 ? 'default' : 'secondary'} className="gap-1">
    <span className="text-xs">Completeness:</span>
    <span className="font-semibold">{completeness > 0 ? `${completeness}/5` : '-'}</span>
  </Badge>
  <Badge variant={empathy >= 3 ? 'default' : 'secondary'} className="gap-1">
    <span className="text-xs">Empathy:</span>
    <span className="font-semibold">{empathy > 0 ? `${empathy}/5` : '-'}</span>
  </Badge>
  <Badge variant={elicitedFactIds.length >= 8 ? 'default' : 'secondary'} className="gap-1">
    <span className="text-xs">Facts:</span>
    <span className="font-semibold">{elicitedFactIds.length}/11</span>
  </Badge>
</div>
```

---

## Conclusion

The application has a **solid foundation** with clean code and good UX patterns. The critical pedagogical requirement (hiding the answer key) is met.

**Most Critical Issues:**
1. Chat area height may not work on all screens
2. Input field needs autoFocus and better accessibility
3. Send button needs visible text label
4. Grading badges should show immediately

**Estimated Time to Fix Critical Issues:** 1-2 hours

**Recommendation:** Implement Priority 1 fixes before deploying to students. Test thoroughly on mobile devices.

---

**Next Steps:**
1. Apply recommended code changes
2. Test on local environment
3. Deploy to https://rushm1chatbot1.vercel.app/
4. Run through complete testing checklist
5. Have 2-3 students beta test
6. Gather feedback and iterate
